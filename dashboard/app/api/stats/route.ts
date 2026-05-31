import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { Interaction } from '@/models/Interaction';
import { Campaign } from '@/models/Campaign';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const [
      totalProspects,
      statusCounts,
      totalInteractions,
      repliesCount,
      meetingsCount,
      closedCount,
      activeCampaigns,
    ] = await Promise.all([
      Prospect.countDocuments({ userId }),
      Prospect.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Interaction.countDocuments({ userId, type: 'email_sent' }),
      Interaction.countDocuments({ userId, type: 'reply_received' }),
      Interaction.countDocuments({ userId, type: 'meeting_scheduled' }),
      Prospect.countDocuments({ userId, status: 'closed' }),
      Campaign.countDocuments({ userId, status: 'active' }),
    ]);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s: any) => { statusMap[s._id] = s.count; });

    const replyRate = totalInteractions > 0
      ? ((repliesCount / totalInteractions) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      overview: {
        totalProspects,
        emailsSent: totalInteractions,
        replies: repliesCount,
        meetings: meetingsCount,
        closedDeals: closedCount,
        activeCampaigns,
        replyRate: `${replyRate}%`,
      },
      statusBreakdown: statusMap,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
