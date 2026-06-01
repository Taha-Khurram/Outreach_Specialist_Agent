import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/models/Campaign';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    await connectDB();

    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, userId, status: 'active' },
      { $set: { status: 'paused' } },
      { new: true }
    ).lean();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found or not active' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    logger.error('POST /api/campaigns/[id]/pause error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
