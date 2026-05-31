import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { Settings } from '@/models/Settings';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    await connectDB();

    const prospect: any = await Prospect.findOne({ _id: id, userId }).lean();
    if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });

    const settings: any = await Settings.findOne({ userId }).lean();
    const geminiKey = settings?.apiKeys?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!geminiKey) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: settings?.ai?.model || 'gemini-3-flash-preview' });

    const prompt = `Score this prospect for a US-based web/mobile development agency. Rate 0-25 for each category.

Prospect:
- Name: ${prospect.firstName} ${prospect.lastName}, Title: ${prospect.title}
- Company: ${prospect.company}, Industry: ${prospect.industry}
- Size: ${prospect.companySize || 'Unknown'} employees
- Tech Stack: ${prospect.techStack?.join(', ') || 'Unknown'}
- Funding: ${prospect.funding || 'Unknown'}${prospect.fundingAmount ? ` ($${prospect.fundingAmount})` : ''}

Scoring criteria:
1. companyFit (0-25): Do they need web/mobile dev? Tech companies 10-500 employees score highest. Industries: SaaS, e-commerce, fintech, healthtech are ideal.
2. roleAuthority (0-25): Can they make/influence buy decisions? CEO/CTO/VP = 25, Director = 20, Manager = 15, IC = 5.
3. engagementSignals (0-25): Recent funding = +10, growing team = +5, using outdated tech = +5, multiple products = +5.
4. timing (0-25): Series A-B companies often outsource to move fast = +15. Pre-revenue startups = +5. Enterprise = +10 if tech stack is legacy.

Return ONLY valid JSON: {"companyFit": N, "roleAuthority": N, "engagementSignals": N, "timing": N, "reasoning": "one sentence"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    const breakdown = JSON.parse(text);

    const score = breakdown.companyFit + breakdown.roleAuthority + breakdown.engagementSignals + breakdown.timing;

    await Prospect.updateOne(
      { _id: id },
      {
        $set: {
          score,
          scoreBreakdown: breakdown,
          scoredAt: new Date(),
        },
      }
    );

    return NextResponse.json({ score, breakdown });
  } catch (error) {
    console.error('POST /api/prospects/[id]/score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
