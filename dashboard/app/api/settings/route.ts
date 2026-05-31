import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    let settings = await Settings.findOne({ userId }).lean();

    if (!settings) {
      const created = await Settings.create({
        userId,
        apiKeys: {
          apolloApiKey: process.env.APOLLO_API_KEY || '',
          geminiApiKey: process.env.GEMINI_API_KEY || '',
          googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
        },
        email: {
          senderEmail: process.env.SENDER_EMAIL || '',
          senderName: process.env.SENDER_NAME || '',
          dailySendLimit: Number(process.env.DAILY_EMAIL_LIMIT) || 50,
          calendlyLink: process.env.CALENDLY_LINK || '',
        },
      });
      settings = created.toObject();
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (body.email?.dailySendLimit !== undefined) {
      const limit = Number(body.email.dailySendLimit);
      if (isNaN(limit) || limit < 1 || limit > 500) {
        return NextResponse.json({ error: 'Daily send limit must be between 1 and 500' }, { status: 400 });
      }
    }

    if (body.ai?.confidenceThreshold !== undefined) {
      const threshold = Number(body.ai.confidenceThreshold);
      if (isNaN(threshold) || threshold < 0.5 || threshold > 1) {
        return NextResponse.json({ error: 'Confidence threshold must be between 0.5 and 1.0' }, { status: 400 });
      }
    }

    await connectDB();

    const updateFields: Record<string, any> = {};
    const allowedSections = ['apiKeys', 'email', 'ai', 'targeting', 'schedule'];

    for (const section of allowedSections) {
      if (body[section]) {
        for (const [key, value] of Object.entries(body[section])) {
          updateFields[`${section}.${key}`] = value;
        }
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
