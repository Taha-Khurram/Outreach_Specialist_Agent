import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';

const CRON_SECRET = process.env.CRON_SECRET;

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
    const userResults: Record<string, Record<string, unknown>> = {};

    for (const s of allSettings) {
      const uid = (s as { userId?: { toString(): string } }).userId?.toString();
      if (!uid) continue;

      const headers: Record<string, string> = { 'x-user-id': uid };
      const userRes: Record<string, unknown> = {};

      try {
        const repliesRes = await fetch(`${baseUrl}/api/replies/check`, { method: 'POST', headers });
        userRes.replies = repliesRes.ok ? await repliesRes.json() : { error: 'failed' };
      } catch (err) {
        userRes.replies = { error: err instanceof Error ? err.message : 'unknown error' };
      }

      try {
        const followUpRes = await fetch(`${baseUrl}/api/campaigns/process`, { method: 'POST', headers });
        userRes.followUps = followUpRes.ok ? await followUpRes.json() : { error: 'failed' };
      } catch (err) {
        userRes.followUps = { error: err instanceof Error ? err.message : 'unknown error' };
      }

      try {
        const bouncesRes = await fetch(`${baseUrl}/api/bounces`, { method: 'POST', headers });
        userRes.bounces = bouncesRes.ok ? await bouncesRes.json() : { error: 'failed' };
      } catch (err) {
        userRes.bounces = { error: err instanceof Error ? err.message : 'unknown error' };
      }

      userResults[uid] = userRes;
    }

    return NextResponse.json({ timestamp: new Date().toISOString(), mode: 'multi-user', users: userResults });
  }

  const headers: Record<string, string> = {};
  if (userId) headers['x-user-id'] = userId;

  const results: Record<string, unknown> = {};

  try {
    const repliesRes = await fetch(`${baseUrl}/api/replies/check`, { method: 'POST', headers });
    results.replies = repliesRes.ok ? await repliesRes.json() : { error: await repliesRes.text() };
  } catch (err) {
    results.replies = { error: err instanceof Error ? err.message : 'unknown error' };
  }

  try {
    const followUpRes = await fetch(`${baseUrl}/api/campaigns/process`, { method: 'POST', headers });
    results.followUps = followUpRes.ok ? await followUpRes.json() : { error: await followUpRes.text() };
  } catch (err) {
    results.followUps = { error: err instanceof Error ? err.message : 'unknown error' };
  }

  try {
    const bouncesRes = await fetch(`${baseUrl}/api/bounces`, { method: 'POST', headers });
    results.bounces = bouncesRes.ok ? await bouncesRes.json() : { error: await bouncesRes.text() };
  } catch (err) {
    results.bounces = { error: err instanceof Error ? err.message : 'unknown error' };
  }

  return NextResponse.json({ timestamp: new Date().toISOString(), mode: 'single-user', ...results });
}

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.replace('Bearer ', '') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const fakeReq = new Request(url, { method: 'POST', headers: { authorization: `Bearer ${CRON_SECRET}` } });
  return POST(fakeReq as unknown as NextRequest);
}
