import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';
import { Prospect } from '@/models/Prospect';
import { Campaign } from '@/models/Campaign';
import { checkBounces } from '@/lib/gmail';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const settings: any = await Settings.findOne({ userId }).lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not configured' }, { status: 400 });
    }

    const gmailAuth = {
      clientId: settings.apiKeys?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: settings.apiKeys?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      refreshToken: settings.apiKeys?.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || '',
    };

    if (!gmailAuth.refreshToken) {
      return NextResponse.json({ error: 'Gmail OAuth not configured' }, { status: 400 });
    }

    const afterTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const bounces = await checkBounces(gmailAuth, afterTimestamp);

    let updated = 0;
    for (const bounce of bounces) {
      const prospect = await Prospect.findOne({ userId, email: bounce.email });
      if (prospect && prospect.status !== 'bounced') {
        await Prospect.updateOne(
          { _id: prospect._id },
          { $set: { status: 'bounced' } }
        );

        await Campaign.updateMany(
          { userId, 'prospects.prospectId': prospect._id, status: 'active' },
          { $set: { 'prospects.$.status': 'bounced', 'prospects.$.nextSendAt': null } }
        );

        updated++;
      }
    }

    return NextResponse.json({ detected: bounces.length, updated });
  } catch (error) {
    console.error('POST /api/bounces error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
