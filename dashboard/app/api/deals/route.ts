import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Deal } from '@/models/Deal';
import { Prospect } from '@/models/Prospect';
import { Interaction } from '@/models/Interaction';
import { validateBody, dealSchema } from '@/lib/validate';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const deals = await Deal.find({ userId }).sort({ closeDate: -1 }).lean();

    const prospectIds = deals.map(d => d.prospectId);
    const prospects = await Prospect.find({ _id: { $in: prospectIds } }).lean();
    const prospectMap = new Map(prospects.map(p => [(p._id as any).toString(), p]));

    const enriched = deals.map(d => ({
      ...d,
      prospect: prospectMap.get(d.prospectId.toString()) || null,
    }));

    const totalRevenue = deals.filter(d => d.status === 'won').reduce((sum, d) => sum + d.value, 0);
    const totalDeals = deals.filter(d => d.status === 'won').length;

    return NextResponse.json({
      deals: enriched,
      summary: { totalRevenue, totalDeals, goal: 2 },
    });
  } catch (error) {
    logger.error('GET /api/deals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validation = validateBody(dealSchema, body);
    if (!validation.success) return validation.response;
    const { prospectId, value, status, notes, services, campaignId } = validation.data;

    await connectDB();

    const prospect = await Prospect.findOne({ _id: prospectId, userId });
    if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

    const deal = await Deal.create({
      userId,
      prospectId,
      campaignId: campaignId || undefined,
      value: Number(value),
      status: status || 'won',
      notes: notes || '',
      services: services || [],
      closeDate: new Date(),
    });

    if (status === 'won') {
      await Prospect.updateOne({ _id: prospectId }, { $set: { status: 'closed' } });
      await Interaction.create({
        userId,
        prospectId,
        type: 'deal_closed',
        subject: `Deal closed: $${Number(value).toLocaleString()}`,
        body: notes || '',
      });
    }

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/deals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
