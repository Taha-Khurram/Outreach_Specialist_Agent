import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { validateBody, prospectSchema } from '@/lib/validate';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const query: Record<string, any> = { userId };
    if (status && status !== 'all') query.status = status;

    const [prospects, total] = await Promise.all([
      Prospect.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Prospect.countDocuments(query),
    ]);

    return NextResponse.json({
      prospects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const body = await req.json();
    const validation = validateBody(prospectSchema, body);
    if (!validation.success) return validation.response;

    const prospect = await Prospect.create({ ...validation.data, userId });
    return NextResponse.json({ prospect }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json({ error: 'Prospect with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
