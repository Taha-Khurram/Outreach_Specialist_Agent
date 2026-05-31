import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { Interaction } from '@/models/Interaction';
import { Campaign } from '@/models/Campaign';
import { Settings } from '@/models/Settings';
import { sendEmail } from '@/lib/gmail';

const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    if (CALENDLY_WEBHOOK_SECRET) {
      const sig = req.headers.get('calendly-webhook-signature');
      if (!sig || !sig.includes(CALENDLY_WEBHOOK_SECRET)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = await req.json();
    const event = payload.event;
    const eventPayload = payload.payload;

    if (event !== 'invitee.created') {
      return NextResponse.json({ received: true, skipped: 'not invitee.created' });
    }

    const inviteeEmail = eventPayload?.email?.toLowerCase()
      || eventPayload?.invitee?.email?.toLowerCase();
    const inviteeName = eventPayload?.name || eventPayload?.invitee?.name || '';
    const scheduledAt = eventPayload?.scheduled_event?.start_time
      || eventPayload?.event?.start_time || '';
    const eventUri = eventPayload?.scheduled_event?.uri
      || eventPayload?.uri || '';

    if (!inviteeEmail) {
      return NextResponse.json({ received: true, skipped: 'no email' });
    }

    await connectDB();

    const prospect = await Prospect.findOne({ email: inviteeEmail });
    if (!prospect) {
      return NextResponse.json({ received: true, skipped: 'prospect not found' });
    }

    const userId = prospect.userId.toString();

    await Prospect.updateOne(
      { _id: prospect._id },
      { $set: { status: 'meeting' } }
    );

    await Interaction.create({
      userId,
      prospectId: prospect._id,
      type: 'meeting_scheduled',
      subject: `Meeting scheduled with ${inviteeName || inviteeEmail}`,
      body: JSON.stringify({
        scheduledAt,
        eventUri,
        inviteeName,
        inviteeEmail,
      }),
    });

    await Campaign.updateMany(
      { userId, 'prospects.prospectId': prospect._id, status: 'active' },
      {
        $set: { 'prospects.$.status': 'replied', 'prospects.$.nextSendAt': null },
        $inc: { 'stats.totalMeetings': 1 },
      }
    );

    const settings: any = await Settings.findOne({ userId }).lean();
    if (settings?.email?.senderEmail) {
      const gmailAuth = {
        clientId: settings.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: settings.apiKeys?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
        refreshToken: settings.apiKeys?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
      };

      if (gmailAuth.refreshToken) {
        try {
          await sendEmail({
            to: settings.email.senderEmail,
            subject: `Meeting Booked: ${prospect.firstName} ${prospect.lastName} (${prospect.company})`,
            body: `Great news! ${prospect.firstName} ${prospect.lastName} from ${prospect.company} just booked a meeting.\n\nScheduled: ${scheduledAt ? new Date(scheduledAt).toLocaleString() : 'See Calendly'}\nEmail: ${inviteeEmail}\nTitle: ${prospect.title}\n\nPrepare your pitch!`,
            senderEmail: settings.email.senderEmail,
            senderName: 'Outreach Agent',
            ...gmailAuth,
          });
        } catch (err: any) {
          console.error('Failed to send meeting notification:', err.message);
        }
      }
    }

    return NextResponse.json({ received: true, matched: true, prospectId: prospect._id });
  } catch (error) {
    console.error('POST /api/webhooks/calendly error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
