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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const interactions = await Interaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const prospectIds = [...new Set(interactions.map((i: any) => i.prospectId?.toString()).filter(Boolean))];
    const prospects = await Prospect.find({ _id: { $in: prospectIds } })
      .select('firstName lastName company')
      .lean();
    const prospectMap = new Map(prospects.map((p: any) => [p._id.toString(), p]));

    const activities = interactions.map((i: any) => ({
      _id: i._id,
      type: i.type,
      subject: i.subject,
      body: i.body?.substring(0, 100) || '',
      classification: i.classification,
      autoReplied: i.autoReplied,
      createdAt: i.createdAt,
      prospect: prospectMap.get(i.prospectId?.toString()) || null,
    }));

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('GET /api/activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
