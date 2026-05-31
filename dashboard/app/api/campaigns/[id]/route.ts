import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/models/Campaign';
import { Prospect } from '@/models/Prospect';

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

    if (campaign.prospects?.length) {
      const prospectIds = campaign.prospects.map((p: any) => p.prospectId);
      const prospects = await Prospect.find({ _id: { $in: prospectIds } })
        .select('firstName lastName email company title status')
        .lean();

      const prospectMap = new Map(prospects.map((p: any) => [p._id.toString(), p]));
      campaign.prospects = campaign.prospects.map((cp: any) => ({
        ...cp,
        prospect: prospectMap.get(cp.prospectId.toString()) || null,
      }));
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('GET /api/campaigns/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    await connectDB();
    const existing: any = await Campaign.findOne({ _id: id, userId }).lean();
    if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (existing.status === 'active' || existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot edit an active or completed campaign. Pause it first.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.steps !== undefined) updateData.steps = body.steps;
    if (body.settings !== undefined) updateData.settings = body.settings;

    if (body.prospectIds !== undefined) {
      updateData.prospects = body.prospectIds.map((pid: string) => ({
        prospectId: pid,
        currentStep: 0,
        status: 'pending',
        nextSendAt: null,
        lastSentAt: null,
      }));
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('PUT /api/campaigns/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    await connectDB();
    const existing: any = await Campaign.findOne({ _id: id, userId }).lean();
    if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (existing.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete an active campaign. Pause it first.' },
        { status: 400 }
      );
    }

    await Campaign.findOneAndDelete({ _id: id, userId });
    return NextResponse.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('DELETE /api/campaigns/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
