import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/models/Campaign';
import { Prospect } from '@/models/Prospect';
import { Interaction } from '@/models/Interaction';
import { Settings } from '@/models/Settings';
import { sendEmail } from '@/lib/gmail';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limit';

function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

function pickVariant(step: any): { subject: string; body: string } {
  if (!step.variants || step.variants.length === 0) {
    return step;
  }
  const totalWeight = step.variants.reduce((sum: number, v: any) => sum + (v.weight || 50), 0) + 50;
  let rand = Math.random() * totalWeight;
  rand -= 50;
  if (rand <= 0) return step;
  for (const variant of step.variants) {
    rand -= variant.weight || 50;
    if (rand <= 0) return variant;
  }
  return step;
}

async function generatePersonalizedEmail(
  geminiApiKey: string,
  step: { subject: string; body: string },
  prospect: any
) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

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

  const prompt = `You are a professional business development representative. Personalize the following email for ${prospect.firstName} ${prospect.lastName}, ${prospect.title} at ${prospect.company} (${prospect.industry}).

Subject template: ${renderedSubject}
Body template: ${renderedBody}

Prospect details:
- Company: ${prospect.company}
- Industry: ${prospect.industry}
- Tech Stack: ${prospect.techStack?.join(', ') || 'Unknown'}
- Company Size: ${prospect.companySize || 'Unknown'} employees
- Funding: ${prospect.funding || 'Unknown'}
${prospect.research ? `
Company Research:
- Summary: ${prospect.research.summary}
- Pain Points: ${prospect.research.painPoints?.join(', ')}
- Talking Points: ${prospect.research.talkingPoints?.join(', ')}
- Tech Needs: ${prospect.research.techNeeds?.join(', ')}
` : ''}
Rules:
- Keep the email under 100 words
- Sound human and conversational, not salesy
- Reference something specific about their company or role
- Include a clear call-to-action
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed, resetIn } = checkRateLimit(`launch:${userId}`, 3, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limited. Please wait before launching another campaign.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    await connectDB();

    const campaign: any = await Campaign.findOne({ _id: id, userId });
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (campaign.status === 'active') {
      return NextResponse.json({ error: 'Campaign is already active' }, { status: 400 });
    }
    if (!campaign.steps?.length) {
      return NextResponse.json({ error: 'Campaign must have at least one step' }, { status: 400 });
    }
    if (!campaign.prospects?.length) {
      return NextResponse.json({ error: 'Campaign must have at least one prospect' }, { status: 400 });
    }

    const settings: any = await Settings.findOne({ userId }).lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not configured' }, { status: 400 });
    }

    const geminiApiKey = settings.apiKeys?.geminiApiKey;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured in Settings' }, { status: 400 });
    }

    const gmailConfig = {
      clientId: settings.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: settings.apiKeys?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: settings.apiKeys?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
      senderEmail: settings.email?.senderEmail || process.env.SENDER_EMAIL || '',
      senderName: settings.email?.senderName || process.env.SENDER_NAME || '',
    };

    if (!gmailConfig.clientId || !gmailConfig.clientSecret || !gmailConfig.refreshToken) {
      return NextResponse.json({ error: 'Gmail OAuth not configured in Settings' }, { status: 400 });
    }

    const prospectIds = campaign.prospects.map((p: any) => p.prospectId);
    const prospects = await Prospect.find({ _id: { $in: prospectIds } }).lean();
    const prospectMap = new Map(prospects.map((p: any) => [p._id.toString(), p]));

    const firstStep = campaign.steps[0];
    let sent = 0;
    let failed = 0;

    for (const cp of campaign.prospects) {
      if (cp.status !== 'pending') continue;

      const prospect: any = prospectMap.get(cp.prospectId.toString());
      if (!prospect || !prospect.email) {
        failed++;
        continue;
      }

      try {
        const stepToUse = pickVariant(firstStep);
        const variantLabel = stepToUse === firstStep ? 'A' : `V${firstStep.variants?.indexOf(stepToUse as any) || 0}`;
        const email = await generatePersonalizedEmail(geminiApiKey, stepToUse, prospect);

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
          variant: variantLabel,
          stepNumber: 1,
        });

        await Prospect.updateOne(
          { _id: prospect._id },
          { $set: { status: 'contacted', lastContactedAt: new Date() } }
        );

        cp.currentStep = 1;
        cp.status = 'sent';
        cp.lastSentAt = new Date();

        if (campaign.steps.length > 1) {
          const nextDelay = campaign.steps[1].delayDays || 3;
          cp.nextSendAt = new Date(Date.now() + nextDelay * 24 * 60 * 60 * 1000);
        }

        sent++;
      } catch (err: any) {
        console.error(`Failed to send to ${prospect.email}:`, err.message);
        failed++;
      }
    }

    campaign.status = 'active';
    campaign.stats.totalSent = (campaign.stats.totalSent || 0) + sent;
    await campaign.save();

    return NextResponse.json({ sent, failed, total: campaign.prospects.length });
  } catch (error) {
    console.error('POST /api/campaigns/[id]/launch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
