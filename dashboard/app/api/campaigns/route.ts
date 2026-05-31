import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/models/Campaign';

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
    console.error('GET /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    const campaignData: any = {
      userId,
      name: body.name.trim(),
      status: 'draft',
      steps: body.steps || [],
      settings: body.settings || { dailyLimit: 20, sendWindow: { start: 9, end: 17 } },
      stats: { totalSent: 0, totalReplies: 0, totalMeetings: 0 },
    };

    if (body.prospectIds?.length) {
      campaignData.prospects = body.prospectIds.map((id: string) => ({
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
    console.error('POST /api/campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
