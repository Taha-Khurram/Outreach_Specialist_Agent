import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/models/Campaign';
import { Interaction } from '@/models/Interaction';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    await connectDB();

    const campaign: any = await Campaign.findOne({ _id: id, userId }).lean();
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const [emailsSent, repliesReceived, meetingsBooked, classifications] = await Promise.all([
      Interaction.countDocuments({ userId, campaignId: id, type: 'email_sent' }),
      Interaction.countDocuments({ userId, campaignId: id, type: 'reply_received' }),
      Interaction.countDocuments({ userId, campaignId: id, type: 'meeting_scheduled' }),
      Interaction.aggregate([
        { $match: { userId, campaignId: new mongoose.Types.ObjectId(id), type: 'reply_received' } },
        { $group: { _id: '$classification', count: { $sum: 1 } } },
      ]),
    ]);

    const classificationMap: Record<string, number> = {};
    classifications.forEach((c: any) => { classificationMap[c._id || 'UNKNOWN'] = c.count; });

    const prospectStatuses: Record<string, number> = {};
    campaign.prospects.forEach((p: any) => {
      prospectStatuses[p.status] = (prospectStatuses[p.status] || 0) + 1;
    });

    const totalProspects = campaign.prospects.length;
    const replyRate = emailsSent > 0 ? ((repliesReceived / emailsSent) * 100).toFixed(1) : '0';
    const meetingRate = repliesReceived > 0 ? ((meetingsBooked / repliesReceived) * 100).toFixed(1) : '0';

    const stepPerformance = campaign.steps.map((step: any, i: number) => {
      const atOrPastStep = campaign.prospects.filter((p: any) => p.currentStep > i).length;
      return {
        stepNumber: step.stepNumber,
        subject: step.subject,
        sent: atOrPastStep,
        deliveryRate: totalProspects > 0 ? ((atOrPastStep / totalProspects) * 100).toFixed(0) : '0',
      };
    });

    const dailyActivity = await Interaction.aggregate([
      {
        $match: {
          userId,
          campaignId: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const activityMap = new Map<string, { sent: number; replies: number }>();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().split('T')[0];
      activityMap.set(key, { sent: 0, replies: 0 });
    }
    dailyActivity.forEach((r: any) => {
      const entry = activityMap.get(r._id.date);
      if (!entry) return;
      if (r._id.type === 'email_sent') entry.sent = r.count;
      if (r._id.type === 'reply_received') entry.replies = r.count;
    });

    const timeline = Array.from(activityMap.entries()).map(([date, values]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...values,
    }));

    return NextResponse.json({
      campaign: {
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
      },
      metrics: {
        totalProspects,
        emailsSent,
        repliesReceived,
        meetingsBooked,
        replyRate: `${replyRate}%`,
        meetingRate: `${meetingRate}%`,
      },
      classifications: classificationMap,
      prospectStatuses,
      stepPerformance,
      timeline,
    });
  } catch (error) {
    logger.error('GET /api/campaigns/[id]/analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
