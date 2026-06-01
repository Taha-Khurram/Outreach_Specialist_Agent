import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/models/Campaign';
import { validateBody, campaignSchema } from '@/lib/validate';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const campaigns = await Campaign.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      campaigns,
      total: campaigns.length,
    });
  } catch (error) {
    logger.error('GET /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const validation = validateBody(campaignSchema, body);
    if (!validation.success) return validation.response;
    const { name, steps, settings, prospectIds } = validation.data;

    const campaignData: Record<string, unknown> = {
      userId,
      name,
      status: 'draft',
      steps,
      settings: settings || { dailyLimit: 20, sendWindow: { start: 9, end: 17 } },
      stats: { totalSent: 0, totalReplies: 0, totalMeetings: 0 },
    };

    if (prospectIds?.length) {
      campaignData.prospects = prospectIds.map((id) => ({
        prospectId: id,
        currentStep: 0,
        status: 'pending',
        nextSendAt: null,
        lastSentAt: null,
      }));
    }

    const campaign = await Campaign.create(campaignData);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
