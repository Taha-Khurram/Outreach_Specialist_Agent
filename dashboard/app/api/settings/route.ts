import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';
import { validateBody, settingsSchema } from '@/lib/validate';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    let settings = await Settings.findOne({ userId }).lean();

    if (!settings) {
      const created = await Settings.create({
        userId,
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
    logger.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validation = validateBody(settingsSchema, body);
    if (!validation.success) return validation.response;
    const validated = validation.data;

    await connectDB();

    const updateFields: Record<string, any> = {};
    const allowedSections = ['email', 'ai', 'targeting', 'schedule', 'goals'] as const;

    for (const section of allowedSections) {
      if (validated[section]) {
        for (const [key, value] of Object.entries(validated[section]!)) {
          if (value !== undefined) {
            updateFields[`${section}.${key}`] = value;
          }
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
    logger.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
