import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/models/Campaign';
import { Prospect } from '@/models/Prospect';
import { Interaction } from '@/models/Interaction';
import { Settings } from '@/models/Settings';
import { sendEmail } from '@/lib/gmail';
import { GoogleGenerativeAI } from '@google/generative-ai';

function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

async function generatePersonalizedEmail(
  geminiApiKey: string,
  step: { subject: string; body: string; stepNumber: number },
  prospect: any,
  previousEmails: string[]
) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const templateData = {
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    company: prospect.company,
    title: prospect.title,
    industry: prospect.industry,
    techStack: prospect.techStack?.join(', ') || '',
  };

  const renderedSubject = renderTemplate(step.subject, templateData);
  const renderedBody = renderTemplate(step.body, templateData);

  const prevContext = previousEmails.length > 0
    ? `\n\nPrevious emails in this sequence (do NOT repeat these):\n${previousEmails.map((e, i) => `Email ${i + 1}: ${e}`).join('\n')}`
    : '';

  const prompt = `You are a professional business development representative writing follow-up email #${step.stepNumber} in a sequence to ${prospect.firstName} ${prospect.lastName}, ${prospect.title} at ${prospect.company} (${prospect.industry}).

Subject template: ${renderedSubject}
Body template: ${renderedBody}

Prospect details:
- Company: ${prospect.company}
- Industry: ${prospect.industry}
- Tech Stack: ${prospect.techStack?.join(', ') || 'Unknown'}
- Company Size: ${prospect.companySize || 'Unknown'} employees
${prevContext}

Rules:
- This is follow-up #${step.stepNumber}, acknowledge you've reached out before
- Keep the email under 80 words
- Sound human and conversational, slightly more direct than previous emails
- Include a clear, low-friction call-to-action
- Return ONLY valid JSON with "subject" and "body" keys, no markdown`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { subject: renderedSubject, body: renderedBody };
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const settings: any = await Settings.findOne({ userId }).lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not configured' }, { status: 400 });
    }

    const geminiApiKey = settings.apiKeys?.geminiApiKey;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });
    }

    const gmailConfig = {
      clientId: settings.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: settings.apiKeys?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: settings.apiKeys?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
      senderEmail: settings.email?.senderEmail || process.env.SENDER_EMAIL || '',
      senderName: settings.email?.senderName || process.env.SENDER_NAME || '',
    };

    if (!gmailConfig.clientId || !gmailConfig.clientSecret || !gmailConfig.refreshToken) {
      return NextResponse.json({ error: 'Gmail OAuth not configured' }, { status: 400 });
    }

    const dailyLimit = settings.campaigns?.dailyLimit || 20;
    const now = new Date();

    const activeCampaigns = await Campaign.find({ userId, status: 'active' });

    const results = { processed: 0, sent: 0, failed: 0, completed: 0 };

    let sentToday = 0;

    for (const campaign of activeCampaigns) {
      const dueProspects = campaign.prospects.filter(
        (p: any) => p.status === 'sent' && p.nextSendAt && new Date(p.nextSendAt) <= now
      );

      if (dueProspects.length === 0) continue;

      const prospectIds = dueProspects.map((p: any) => p.prospectId);
      const prospects = await Prospect.find({ _id: { $in: prospectIds } }).lean();
      const prospectMap = new Map(prospects.map((p: any) => [p._id.toString(), p]));

      for (const cp of dueProspects) {
        if (sentToday >= dailyLimit) break;

        results.processed++;
        const prospect: any = prospectMap.get(cp.prospectId.toString());
        if (!prospect || !prospect.email) {
          results.failed++;
          continue;
        }

        const nextStepIndex = cp.currentStep;
        if (nextStepIndex >= campaign.steps.length) {
          cp.status = 'sent';
          cp.nextSendAt = null;
          continue;
        }

        const step = campaign.steps[nextStepIndex];

        const previousInteractions = await Interaction.find({
          userId,
          prospectId: prospect._id,
          campaignId: campaign._id,
          type: 'email_sent',
        }).sort({ createdAt: 1 }).select('body').lean();
        const previousEmails = previousInteractions.map((i: any) => i.body?.substring(0, 150) || '');

        try {
          const email = await generatePersonalizedEmail(geminiApiKey, step, prospect, previousEmails);

          await sendEmail({
            to: prospect.email,
            subject: email.subject,
            body: email.body,
            senderEmail: gmailConfig.senderEmail,
            senderName: gmailConfig.senderName,
            clientId: gmailConfig.clientId,
            clientSecret: gmailConfig.clientSecret,
            refreshToken: gmailConfig.refreshToken,
          });

          await Interaction.create({
            userId,
            prospectId: prospect._id,
            campaignId: campaign._id,
            type: 'email_sent',
            subject: email.subject,
            body: email.body,
          });

          await Prospect.updateOne(
            { _id: prospect._id },
            { $set: { lastContactedAt: new Date() } }
          );

          cp.currentStep = nextStepIndex + 1;
          cp.lastSentAt = new Date();

          if (nextStepIndex + 1 < campaign.steps.length) {
            const nextDelay = campaign.steps[nextStepIndex + 1].delayDays || 3;
            cp.nextSendAt = new Date(Date.now() + nextDelay * 24 * 60 * 60 * 1000);
          } else {
            cp.nextSendAt = null;
          }

          results.sent++;
          sentToday++;
        } catch (err: any) {
          console.error(`Follow-up failed for ${prospect.email}:`, err.message);
          results.failed++;
        }
      }

      const allDone = campaign.prospects.every(
        (p: any) => p.status === 'replied' || p.status === 'unsubscribed' || p.status === 'bounced' ||
          (p.currentStep >= campaign.steps.length && p.nextSendAt === null)
      );

      if (allDone) {
        campaign.status = 'completed';
        results.completed++;
      }

      campaign.stats.totalSent = (campaign.stats.totalSent || 0) + results.sent;
      await campaign.save();
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('POST /api/campaigns/process error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
