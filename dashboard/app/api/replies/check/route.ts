import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';
import { Prospect } from '@/models/Prospect';
import { Interaction } from '@/models/Interaction';
import { Campaign } from '@/models/Campaign';
import { getUnreadReplies, markAsRead, replyToThread, sendEmail } from '@/lib/gmail';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : from.toLowerCase().trim();
}

async function classifyReplyWithAI(geminiApiKey: string, replyText: string) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `Classify this email reply into one of these categories:
- POSITIVE: interested in meeting, wants to learn more, asks about services
- NEUTRAL: non-committal, asks clarifying questions, requests more info
- NEGATIVE: not interested, wrong timing, already has a solution
- UNSUBSCRIBE: explicitly asks to be removed, says stop emailing

Also provide a confidence score (0.0-1.0), extract any explicit request, and note if they asked a question.

Reply text:
"""
${replyText}
"""

Return ONLY valid JSON with these keys:
{"classification": "POSITIVE|NEUTRAL|NEGATIVE|UNSUBSCRIBE", "confidence": 0.0-1.0, "request": "extracted request or null", "hasQuestion": true/false}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { classification: 'NEUTRAL', confidence: 0.5, request: null, hasQuestion: false };
  }
}

async function generateAutoReply(geminiApiKey: string, classification: string, prospect: any, replyText: string, calendlyLink: string) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  let instructions = '';
  if (classification === 'POSITIVE') {
    instructions = `They are interested! Write a brief, enthusiastic reply. Answer any questions concisely. Suggest a quick call via this link: ${calendlyLink}. Keep it under 80 words.`;
  } else if (classification === 'UNSUBSCRIBE') {
    instructions = `They want to unsubscribe. Apologize briefly, confirm removal, and wish them well. Keep it under 40 words.`;
  } else {
    instructions = `They seem neutral. Ask one clarifying question about their tech challenges to re-engage. Keep it under 60 words.`;
  }

  const prompt = `You are replying to ${prospect.firstName} ${prospect.lastName} (${prospect.title} at ${prospect.company}).

Their reply:
"""
${replyText}
"""

${instructions}

Sound human and conversational. No subject line needed - just the reply body.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function sendNotificationEmail(gmailAuth: any, senderEmail: string, prospect: any, classification: any, msg: any) {
  await sendEmail({
    to: senderEmail,
    subject: `🎯 Positive Reply: ${prospect.firstName} ${prospect.lastName} (${prospect.company})`,
    body: `${prospect.firstName} ${prospect.lastName} (${prospect.title} at ${prospect.company}) sent a positive reply!\n\nSubject: ${msg.subject}\n\nTheir message:\n${msg.body.substring(0, 500)}\n\nConfidence: ${Math.round(classification.confidence * 100)}%\n\nLog into your dashboard to follow up.`,
    senderEmail,
    senderName: 'Outreach Agent',
    ...gmailAuth,
  });
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed, resetIn } = checkRateLimit(`replycheck:${userId}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limited. Please wait before checking again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
      );
    }

    await connectDB();

    const settings: any = await Settings.findOne({ userId }).lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not configured' }, { status: 400 });
    }

    const geminiApiKey = settings.apiKeys?.geminiApiKey;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });
    }

    const gmailAuth = {
      clientId: settings.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: settings.apiKeys?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: settings.apiKeys?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
    };

    if (!gmailAuth.clientId || !gmailAuth.clientSecret || !gmailAuth.refreshToken) {
      return NextResponse.json({ error: 'Gmail OAuth not configured' }, { status: 400 });
    }

    const senderEmail = settings.email?.senderEmail || process.env.SENDER_EMAIL || '';
    const senderName = settings.email?.senderName || process.env.SENDER_NAME || '';
    const calendlyLink = settings.email?.calendlyLink || process.env.CALENDLY_LINK || '';
    const confidenceThreshold = settings.ai?.confidenceThreshold || 0.8;
    const autoReplyPositive = settings.ai?.autoReplyPositive !== false;
    const autoUnsubscribe = settings.ai?.autoUnsubscribe !== false;

    const afterTimestamp = Date.now() - 24 * 60 * 60 * 1000;
    const messages = await getUnreadReplies(gmailAuth, afterTimestamp);

    const results = { checked: 0, classified: { positive: 0, neutral: 0, negative: 0, unsubscribe: 0 }, autoReplied: 0, skipped: 0 };

    for (const msg of messages) {
      results.checked++;
      const fromEmail = extractEmail(msg.from);

      const prospect: any = await Prospect.findOne({ userId, email: fromEmail }).lean();
      if (!prospect) {
        results.skipped++;
        continue;
      }

      const existingInteraction = await Interaction.findOne({
        userId,
        prospectId: prospect._id,
        type: 'reply_received',
        subject: msg.subject,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      });
      if (existingInteraction) {
        results.skipped++;
        continue;
      }

      const classification = await classifyReplyWithAI(geminiApiKey, msg.body);
      const classKey = classification.classification?.toLowerCase() as keyof typeof results.classified;
      if (classKey in results.classified) results.classified[classKey]++;

      const interaction = await Interaction.create({
        userId,
        prospectId: prospect._id,
        type: 'reply_received',
        classification: classification.classification,
        confidence: classification.confidence,
        subject: msg.subject,
        body: msg.body,
        autoReplied: false,
      });

      const newStatus = classification.classification === 'UNSUBSCRIBE' ? 'unsubscribed' : 'replied';
      await Prospect.updateOne({ _id: prospect._id }, { $set: { status: newStatus } });

      await Campaign.updateMany(
        { userId, 'prospects.prospectId': prospect._id, status: 'active' },
        { $set: { 'prospects.$.status': 'replied' }, $inc: { 'stats.totalReplies': 1 } }
      );

      if (classification.classification === 'POSITIVE' && senderEmail && gmailAuth.refreshToken) {
        try {
          await sendNotificationEmail(gmailAuth, senderEmail, prospect, classification, msg);
        } catch {}
      }

      const shouldAutoReply =
        classification.confidence >= confidenceThreshold &&
        ((classification.classification === 'POSITIVE' && autoReplyPositive) ||
         (classification.classification === 'UNSUBSCRIBE' && autoUnsubscribe));

      if (shouldAutoReply) {
        try {
          const replyBody = await generateAutoReply(
            geminiApiKey,
            classification.classification,
            prospect,
            msg.body,
            calendlyLink
          );

          await replyToThread({
            threadId: msg.threadId,
            to: fromEmail,
            subject: msg.subject,
            body: replyBody,
            senderEmail,
            senderName,
            ...gmailAuth,
          });

          await Interaction.updateOne({ _id: interaction._id }, { $set: { autoReplied: true } });
          results.autoReplied++;
        } catch (err: any) {
          logger.error(`Auto-reply failed for ${fromEmail}:`, err.message);
        }
      }

      try {
        await markAsRead(gmailAuth, msg.id);
      } catch {}
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error('POST /api/replies/check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
