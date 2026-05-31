import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const userId = req.headers.get('x-user-id');

  if (!userId && CRON_SECRET) {
    const token = authHeader?.replace('Bearer ', '');
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!userId && !CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = req.nextUrl.origin;
  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;

  const results: Record<string, any> = {};

  try {
    const repliesRes = await fetch(`${baseUrl}/api/replies/check`, {
      method: 'POST',
      headers,
    });
    results.replies = repliesRes.ok ? await repliesRes.json() : { error: await repliesRes.text() };
  } catch (err: any) {
    results.replies = { error: err.message };
  }

  try {
    const followUpRes = await fetch(`${baseUrl}/api/campaigns/process`, {
      method: 'POST',
      headers,
    });
    results.followUps = followUpRes.ok ? await followUpRes.json() : { error: await followUpRes.text() };
  } catch (err: any) {
    results.followUps = { error: err.message };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    ...results,
  });
}
