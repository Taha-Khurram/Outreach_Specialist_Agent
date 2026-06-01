import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';
import { validateBody, settingsSchema } from '@/lib/validate';
import { encrypt, decrypt, SENSITIVE_API_KEY_FIELDS } from '@/lib/encryption';
import { logger } from '@/lib/logger';

function decryptApiKeys(settings: any) {
  if (settings?.apiKeys) {
    const decrypted = { ...settings, apiKeys: { ...settings.apiKeys } };
    for (const field of SENSITIVE_API_KEY_FIELDS) {
      if (decrypted.apiKeys[field]) {
        decrypted.apiKeys[field] = decrypt(decrypted.apiKeys[field]);
      }
    }
    return decrypted;
  }
  return settings;
}

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
          apolloApiKey: encrypt(process.env.APOLLO_API_KEY || ''),
          geminiApiKey: encrypt(process.env.GEMINI_API_KEY || ''),
          googleRefreshToken: encrypt(process.env.GOOGLE_REFRESH_TOKEN || ''),
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

    return NextResponse.json({ settings: decryptApiKeys(settings) });
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
    const allowedSections = ['apiKeys', 'email', 'ai', 'targeting', 'schedule'] as const;

    for (const section of allowedSections) {
      if (validated[section]) {
        for (const [key, value] of Object.entries(validated[section]!)) {
          if (value !== undefined) {
            if (section === 'apiKeys' && SENSITIVE_API_KEY_FIELDS.includes(key)) {
              updateFields[`${section}.${key}`] = encrypt(value as string);
            } else {
              updateFields[`${section}.${key}`] = value;
            }
          }
        }
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ settings: decryptApiKeys(settings) });
  } catch (error) {
    logger.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
