import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { getDecryptedSettings } from '@/lib/settings';
import { logger } from '@/lib/logger';

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

    const settings: any = await getDecryptedSettings(userId);
    const geminiKey = settings?.apiKeys?.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!geminiKey) return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 400 });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: settings?.ai?.model || 'gemini-3-flash-preview' });

    const prompt = `Research this company for a cold outreach email from a US web/mobile development agency.

Company: ${prospect.company}
Industry: ${prospect.industry || 'Unknown'}
Known Tech: ${prospect.techStack?.join(', ') || 'Unknown'}
Size: ${prospect.companySize || 'Unknown'} employees
Contact: ${prospect.firstName} ${prospect.lastName}, ${prospect.title}
Funding: ${prospect.funding || 'Unknown'}${prospect.fundingAmount ? ` ($${prospect.fundingAmount})` : ''}

Provide:
1. summary: 2-3 sentence overview of what the company likely does and their current stage
2. painPoints: 3-5 likely tech pain points they face (be specific to their industry/size)
3. talkingPoints: 3-5 personalization hooks for outreach (specific, not generic)
4. recentNews: Any notable recent activity (funding, launches, hiring) based on the data provided
5. techNeeds: 2-3 specific technical needs where a web/mobile dev team could help

Return ONLY valid JSON: {"summary": "...", "painPoints": ["..."], "talkingPoints": ["..."], "recentNews": "...", "techNeeds": ["..."]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    const research = JSON.parse(text);
    research.researchedAt = new Date();

    await Prospect.updateOne(
      { _id: id },
      { $set: { research } }
    );

    return NextResponse.json({ research });
  } catch (error) {
    logger.error('POST /api/prospects/[id]/research error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
