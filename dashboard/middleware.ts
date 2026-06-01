import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyTokenEdge(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];
  const cronPaths = ['/api/cron', '/api/health'];
  const webhookPaths = ['/api/webhooks/'];

  if (cronPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (webhookPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (publicPaths.some(p => pathname.startsWith(p))) {
    if (pathname.startsWith('/api/auth/')) {
      const method = request.method;
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        if (origin) {
          try {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
              return NextResponse.json({ error: 'CSRF: origin mismatch' }, { status: 403 });
            }
          } catch {
            return NextResponse.json({ error: 'CSRF: invalid origin' }, { status: 403 });
          }
        }
      }
    }

    const token = request.cookies.get('token')?.value;
    if (token && (pathname === '/login' || pathname === '/signup')) {
      const session = await verifyTokenEdge(token);
      if (session) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = await verifyTokenEdge(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: 'CSRF: origin mismatch' }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: 'CSRF: invalid origin' }, { status: 403 });
        }
      }
    }

    const headers = new Headers(request.headers);
    headers.set('x-user-id', session.userId);
    return NextResponse.next({ request: { headers } });
  }

  // Dashboard pages - require auth
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await verifyTokenEdge(token);
  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('token', '', { maxAge: 0, path: '/' });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
