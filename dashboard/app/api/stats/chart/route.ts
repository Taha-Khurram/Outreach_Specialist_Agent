import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Interaction } from '@/models/Interaction';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 90);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    const pipeline = [
      {
        $match: {
          userId,
          createdAt: { $gte: startDate },
          type: { $in: ['email_sent', 'reply_received', 'meeting_scheduled'] },
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
      { $sort: { '_id.date': 1 as const } },
    ];

    const results = await Interaction.aggregate(pipeline);

    const dateMap = new Map<string, { sent: number; replies: number; meetings: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, { sent: 0, replies: 0, meetings: 0 });
    }

    for (const r of results) {
      const entry = dateMap.get(r._id.date);
      if (!entry) continue;
      switch (r._id.type) {
        case 'email_sent': entry.sent = r.count; break;
        case 'reply_received': entry.replies = r.count; break;
        case 'meeting_scheduled': entry.meetings = r.count; break;
      }
    }

    const data = Array.from(dateMap.entries()).map(([date, values]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...values,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('GET /api/stats/chart error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
