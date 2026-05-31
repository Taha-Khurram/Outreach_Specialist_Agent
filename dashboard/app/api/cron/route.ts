import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const userId = req.headers.get('x-user-id');

  const isCronAuth = CRON_SECRET && authHeader?.replace('Bearer ', '') === CRON_SECRET;

  if (!userId && !isCronAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = req.nextUrl.origin;

  if (isCronAuth && !userId) {
    await connectDB();
    const allSettings = await Settings.find({}).select('userId').lean();
    const userResults: Record<string, any> = {};

    for (const s of allSettings) {
      const uid = (s as any).userId?.toString();
      if (!uid) continue;

      const headers: Record<string, string> = { 'x-user-id': uid };
      const userRes: Record<string, any> = {};

      try {
        const repliesRes = await fetch(`${baseUrl}/api/replies/check`, { method: 'POST', headers });
        userRes.replies = repliesRes.ok ? await repliesRes.json() : { error: 'failed' };
      } catch (err: any) {
        userRes.replies = { error: err.message };
      }

      try {
        const followUpRes = await fetch(`${baseUrl}/api/campaigns/process`, { method: 'POST', headers });
        userRes.followUps = followUpRes.ok ? await followUpRes.json() : { error: 'failed' };
      } catch (err: any) {
        userRes.followUps = { error: err.message };
      }

      try {
        const bouncesRes = await fetch(`${baseUrl}/api/bounces`, { method: 'POST', headers });
        userRes.bounces = bouncesRes.ok ? await bouncesRes.json() : { error: 'failed' };
      } catch (err: any) {
        userRes.bounces = { error: err.message };
      }

      userResults[uid] = userRes;
    }

    return NextResponse.json({ timestamp: new Date().toISOString(), mode: 'multi-user', users: userResults });
  }

  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;

  const results: Record<string, any> = {};

  try {
    const repliesRes = await fetch(`${baseUrl}/api/replies/check`, { method: 'POST', headers });
    results.replies = repliesRes.ok ? await repliesRes.json() : { error: await repliesRes.text() };
  } catch (err: any) {
    results.replies = { error: err.message };
  }

  try {
    const followUpRes = await fetch(`${baseUrl}/api/campaigns/process`, { method: 'POST', headers });
    results.followUps = followUpRes.ok ? await followUpRes.json() : { error: await followUpRes.text() };
  } catch (err: any) {
    results.followUps = { error: err.message };
  }

  try {
    const bouncesRes = await fetch(`${baseUrl}/api/bounces`, { method: 'POST', headers });
    results.bounces = bouncesRes.ok ? await bouncesRes.json() : { error: await bouncesRes.text() };
  } catch (err: any) {
    results.bounces = { error: err.message };
  }

  return NextResponse.json({ timestamp: new Date().toISOString(), mode: 'single-user', ...results });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!CRON_SECRET || authHeader?.replace('Bearer ', '') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const fakeReq = new Request(url, { method: 'POST', headers: { authorization: `Bearer ${CRON_SECRET}` } });
  return POST(fakeReq as unknown as NextRequest);
}
