import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    await connectDB();
    const prospect = await Prospect.findOne({ _id: id, userId }).lean();
    if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

    return NextResponse.json({ prospect });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    await connectDB();
    const body = await req.json();

    const allowedFields = [
      'firstName', 'lastName', 'email', 'title', 'company', 'industry',
      'techStack', 'funding', 'fundingAmount', 'companySize', 'linkedinUrl',
      'status', 'notes', 'lastContactedAt',
    ];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const prospect = await Prospect.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    return NextResponse.json({ prospect });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A prospect with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    await connectDB();
    const prospect = await Prospect.findOneAndDelete({ _id: id, userId });
    if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

    return NextResponse.json({ message: 'Prospect deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
