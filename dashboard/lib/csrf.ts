import { NextRequest, NextResponse } from 'next/server';

export function csrfCheck(req: NextRequest): NextResponse | null {
  const method = req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return NextResponse.json({ error: 'CSRF check failed: origin mismatch' }, { status: 403 });
    }
  }

  const requestedWith = req.headers.get('x-requested-with');
  if (!requestedWith) {
    return NextResponse.json({ error: 'CSRF check failed: missing X-Requested-With header' }, { status: 403 });
  }

  return null;
}
