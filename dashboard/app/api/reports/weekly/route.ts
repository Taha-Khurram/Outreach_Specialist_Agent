import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Interaction } from '@/models/Interaction';
import { Prospect } from '@/models/Prospect';
import { Campaign } from '@/models/Campaign';
import { Deal } from '@/models/Deal';
import { Settings } from '@/models/Settings';
import { sendEmail } from '@/lib/gmail';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      emailsSent,
      repliesReceived,
      meetingsBooked,
      dealsWon,
      newProspects,
      activeCampaigns,
      totalProspects,
    ] = await Promise.all([
      Interaction.countDocuments({ userId, type: 'email_sent', createdAt: { $gte: weekAgo } }),
      Interaction.countDocuments({ userId, type: 'reply_received', createdAt: { $gte: weekAgo } }),
      Interaction.countDocuments({ userId, type: 'meeting_scheduled', createdAt: { $gte: weekAgo } }),
      Deal.countDocuments({ userId, status: 'won', createdAt: { $gte: weekAgo } }),
      Prospect.countDocuments({ userId, createdAt: { $gte: weekAgo } }),
      Campaign.countDocuments({ userId, status: 'active' }),
      Prospect.countDocuments({ userId }),
    ]);

    const pipelineBreakdown = await Prospect.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const pipeline: Record<string, number> = {};
    pipelineBreakdown.forEach((p: any) => { pipeline[p._id] = p.count; });

    const replyRate = emailsSent > 0 ? ((repliesReceived / emailsSent) * 100).toFixed(1) : '0';
    const meetingRate = repliesReceived > 0 ? ((meetingsBooked / repliesReceived) * 100).toFixed(1) : '0';

    const report = {
      period: { start: weekAgo.toISOString(), end: new Date().toISOString() },
      metrics: {
        emailsSent,
        repliesReceived,
        meetingsBooked,
        dealsWon,
        newProspects,
        replyRate: `${replyRate}%`,
        meetingRate: `${meetingRate}%`,
      },
      pipeline,
      activeCampaigns,
      totalProspects,
    };

    const settings: any = await Settings.findOne({ userId }).lean();
    if (settings?.email?.senderEmail) {
      const gmailAuth = {
        clientId: settings.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: settings.apiKeys?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
        refreshToken: settings.apiKeys?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
      };

      if (gmailAuth.refreshToken) {
        const reportBody = `Weekly Outreach Report
${'-'.repeat(40)}

Emails Sent: ${emailsSent}
Replies: ${repliesReceived} (${replyRate}% rate)
Meetings Booked: ${meetingsBooked} (${meetingRate}% conversion)
Deals Won: ${dealsWon}
New Prospects: ${newProspects}

Pipeline:
- New: ${pipeline['new'] || 0}
- Contacted: ${pipeline['contacted'] || 0}
- Replied: ${pipeline['replied'] || 0}
- Meeting: ${pipeline['meeting'] || 0}
- Closed: ${pipeline['closed'] || 0}

Active Campaigns: ${activeCampaigns}
Total Prospects: ${totalProspects}

Keep pushing! 🎯`;

        try {
          await sendEmail({
            to: settings.email.senderEmail,
            subject: `Weekly Report: ${emailsSent} sent, ${repliesReceived} replies, ${meetingsBooked} meetings`,
            body: reportBody,
            senderEmail: settings.email.senderEmail,
            senderName: 'ClientFlow Reports',
            ...gmailAuth,
          });
          report.period.end = new Date().toISOString();
        } catch (err: any) {
          logger.error('Failed to send report email:', err.message);
        }
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    logger.error('POST /api/reports/weekly error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
