import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';

export async function getDecryptedSettings(userId: string) {
  await connectDB();
  const settings: any = await Settings.findOne({ userId }).lean();
  if (!settings) return null;

  settings.apiKeys = {
    apolloApiKey: process.env.APOLLO_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  };

  return settings;
}
