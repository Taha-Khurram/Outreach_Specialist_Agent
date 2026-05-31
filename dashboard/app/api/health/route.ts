import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {};

  checks.server = { status: 'ok' };

  if (mongoose.connection.readyState === 1) {
    checks.database = { status: 'ok' };
  } else if (mongoose.connection.readyState === 2) {
    checks.database = { status: 'connecting' };
  } else {
    checks.database = { status: 'disconnected', message: 'MongoDB not connected' };
  }

  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  const optionalEnvVars = ['GEMINI_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'CRON_SECRET'];

  const missingRequired = requiredEnvVars.filter(v => !process.env[v]);
  const missingOptional = optionalEnvVars.filter(v => !process.env[v]);

  checks.env = {
    status: missingRequired.length === 0 ? 'ok' : 'error',
    message: missingRequired.length > 0 ? `Missing: ${missingRequired.join(', ')}` : undefined,
  };

  const overall = Object.values(checks).every(c => c.status === 'ok') ? 'healthy' : 'degraded';

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    checks,
    warnings: missingOptional.length > 0 ? `Optional env vars missing: ${missingOptional.join(', ')}` : undefined,
  }, { status: overall === 'healthy' ? 200 : 503 });
}
