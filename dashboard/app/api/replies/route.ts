import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Interaction } from '@/models/Interaction';
import { Prospect } from '@/models/Prospect';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const classification = searchParams.get('classification');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const filter: any = { userId, type: 'reply_received' };
    if (classification && classification !== 'all') {
      filter.classification = classification.toUpperCase();
    }

    const [replies, total] = await Promise.all([
      Interaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Interaction.countDocuments(filter),
    ]);

    const prospectIds = [...new Set(replies.map((r: any) => r.prospectId))];
    const prospects = await Prospect.find({ _id: { $in: prospectIds } })
      .select('firstName lastName email company title')
      .lean();
    const prospectMap = new Map(prospects.map((p: any) => [p._id.toString(), p]));

    const enriched = replies.map((r: any) => ({
      ...r,
      prospect: prospectMap.get(r.prospectId?.toString()) || null,
    }));

    const counts = await Interaction.aggregate([
      { $match: { userId, type: 'reply_received' } },
      { $group: { _id: '$classification', count: { $sum: 1 } } },
    ]);
    const classificationCounts: Record<string, number> = {};
    counts.forEach((c: any) => { classificationCounts[c._id || 'UNKNOWN'] = c.count; });

    return NextResponse.json({
      replies: enriched,
      pagination: { total, limit, offset },
      counts: classificationCounts,
    });
  } catch (error) {
    console.error('GET /api/replies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
