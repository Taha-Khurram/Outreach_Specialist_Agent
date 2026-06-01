import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Interaction } from '@/models/Interaction';
import { Settings } from '@/models/Settings';
import { replyToThread } from '@/lib/gmail';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid interaction ID' }, { status: 400 });
    }

    const { body: replyBody } = await req.json();
    if (!replyBody?.trim()) {
      return NextResponse.json({ error: 'Reply body is required' }, { status: 400 });
    }

    await connectDB();

    const interaction: any = await Interaction.findOne({ _id: id, userId }).lean();
    if (!interaction) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
    }

    const settings: any = await Settings.findOne({ userId }).lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not configured' }, { status: 400 });
    }

    const gmailAuth = {
      clientId: settings.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: settings.apiKeys?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: settings.apiKeys?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
    };
    const senderEmail = settings.email?.senderEmail || process.env.SENDER_EMAIL || '';
    const senderName = settings.email?.senderName || process.env.SENDER_NAME || '';

    if (!gmailAuth.refreshToken) {
      return NextResponse.json({ error: 'Gmail OAuth not configured' }, { status: 400 });
    }

    const fromEmail = interaction.body?.match(/From:.*?<([^>]+)>/)?.[1] || '';
    const Prospect = (await import('@/models/Prospect')).Prospect;
    const prospect: any = await Prospect.findOne({ _id: interaction.prospectId }).lean();
    const recipientEmail = prospect?.email || fromEmail;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Cannot determine recipient email' }, { status: 400 });
    }

    const result = await replyToThread({
      threadId: interaction.threadId || interaction._id.toString(),
      to: recipientEmail,
      subject: interaction.subject || 'Re: Follow up',
      body: replyBody.trim(),
      senderEmail,
      senderName,
      ...gmailAuth,
    });

    await Interaction.create({
      userId,
      prospectId: interaction.prospectId,
      campaignId: interaction.campaignId,
      type: 'email_sent',
      subject: `Re: ${interaction.subject || ''}`,
      body: replyBody.trim(),
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    logger.error('POST /api/replies/[id]/reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
