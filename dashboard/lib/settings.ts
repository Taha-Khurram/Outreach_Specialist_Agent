import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';
import { decrypt, SENSITIVE_API_KEY_FIELDS } from '@/lib/encryption';

export async function getDecryptedSettings(userId: string) {
  await connectDB();
  const settings: any = await Settings.findOne({ userId }).lean();
  if (!settings) return null;

  if (settings.apiKeys) {
    for (const field of SENSITIVE_API_KEY_FIELDS) {
      if (settings.apiKeys[field]) {
        settings.apiKeys[field] = decrypt(settings.apiKeys[field]);
      }
    }
  }

  return settings;
}
