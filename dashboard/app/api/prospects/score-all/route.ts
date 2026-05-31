import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { Settings } from '@/models/Settings';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed } = checkRateLimit(`score-all:${userId}`, 1, 60000);
    if (!allowed) return NextResponse.json({ error: 'Rate limited. Try again in a minute.' }, { status: 429 });

    await connectDB();

    const settings: any = await Settings.findOne({ userId }).lean();
    const geminiKey = settings?.apiKeys?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!geminiKey) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });

    const prospects = await Prospect.find({ userId, score: null }).limit(20).lean();
    if (prospects.length === 0) {
      return NextResponse.json({ scored: 0, message: 'All prospects are already scored' });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: settings?.ai?.model || 'gemini-3-flash-preview' });

    let scored = 0;

    for (const prospect of prospects) {
      try {
        const prompt = `Score this prospect for a US-based web/mobile development agency. Rate 0-25 for each category.

Prospect:
- Name: ${prospect.firstName} ${prospect.lastName}, Title: ${prospect.title}
- Company: ${prospect.company}, Industry: ${prospect.industry}
- Size: ${prospect.companySize || 'Unknown'} employees
- Tech Stack: ${prospect.techStack?.join(', ') || 'Unknown'}
- Funding: ${prospect.funding || 'Unknown'}

Scoring criteria:
1. companyFit (0-25): Do they need web/mobile dev? Tech companies 10-500 employees score highest.
2. roleAuthority (0-25): Can they make/influence buy decisions? CEO/CTO/VP = 25, Director = 20, Manager = 15, IC = 5.
3. engagementSignals (0-25): Recent funding = +10, growing team = +5, using outdated tech = +5.
4. timing (0-25): Series A-B = +15, Pre-revenue = +5, Enterprise with legacy = +10.

Return ONLY valid JSON: {"companyFit": N, "roleAuthority": N, "engagementSignals": N, "timing": N, "reasoning": "one sentence"}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
        const breakdown = JSON.parse(text);
        const score = breakdown.companyFit + breakdown.roleAuthority + breakdown.engagementSignals + breakdown.timing;

        await Prospect.updateOne(
          { _id: prospect._id },
          { $set: { score, scoreBreakdown: breakdown, scoredAt: new Date() } }
        );
        scored++;
      } catch (err) {
        console.error(`Failed to score prospect ${prospect._id}:`, err);
      }
    }

    return NextResponse.json({ scored, total: prospects.length });
  } catch (error) {
    console.error('POST /api/prospects/score-all error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
