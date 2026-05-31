import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { Interaction } from '@/models/Interaction';
import { Settings } from '@/models/Settings';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const settings: any = await Settings.findOne({ userId }).lean();
    const geminiKey = settings?.apiKeys?.geminiApiKey || process.env.GEMINI_API_KEY;

    const prospects = await Prospect.find({
      userId,
      status: { $in: ['new', 'contacted', 'replied', 'meeting'] },
    }).lean();

    if (prospects.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const recentInteractions = await Interaction.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 }).limit(100).lean();

    const interactionsByProspect = new Map<string, any[]>();
    for (const i of recentInteractions) {
      const pid = i.prospectId.toString();
      if (!interactionsByProspect.has(pid)) interactionsByProspect.set(pid, []);
      interactionsByProspect.get(pid)!.push(i);
    }

    const suggestions: any[] = [];

    for (const p of prospects) {
      const interactions = interactionsByProspect.get((p._id as any).toString()) || [];
      const lastContact = interactions[0]?.createdAt;
      const daysSinceContact = lastContact
        ? Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let priority = 0;
      let reason = '';

      if (p.status === 'meeting') {
        priority = 95;
        reason = 'Has a meeting scheduled — prepare and follow up';
      } else if (p.status === 'replied') {
        const lastReply = interactions.find(i => i.type === 'reply_received');
        if (lastReply?.classification === 'POSITIVE') {
          priority = 90;
          reason = 'Positive reply — book a meeting immediately';
        } else if (lastReply?.classification === 'NEUTRAL') {
          priority = 70;
          reason = 'Neutral reply — answer their question and re-engage';
        } else {
          priority = 50;
          reason = 'Replied — review and decide next step';
        }
      } else if (p.status === 'contacted' && daysSinceContact && daysSinceContact >= 3) {
        priority = 60 + Math.min(daysSinceContact, 10);
        reason = `No response in ${daysSinceContact} days — consider follow-up`;
      } else if (p.status === 'new' && (p.score || 0) >= 70) {
        priority = 55;
        reason = `High-score prospect (${p.score}) — add to campaign`;
      } else if (p.status === 'new') {
        priority = 30;
        reason = 'New prospect — score and research before outreach';
      } else {
        priority = 20;
        reason = 'Recently contacted — wait for response';
      }

      suggestions.push({
        prospectId: p._id,
        firstName: p.firstName,
        lastName: p.lastName,
        company: p.company,
        title: p.title,
        status: p.status,
        score: p.score,
        priority,
        reason,
        daysSinceContact,
        lastInteraction: interactions[0] || null,
      });
    }

    suggestions.sort((a, b) => b.priority - a.priority);

    let aiInsight = '';
    if (geminiKey && suggestions.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: settings?.ai?.model || 'gemini-2.0-flash' });

        const topProspects = suggestions.slice(0, 5).map(s =>
          `- ${s.firstName} ${s.lastName} (${s.company}): ${s.status}, score ${s.score || '?'}, ${s.reason}`
        ).join('\n');

        const result = await model.generateContent(
          `You are a sales coach. Based on these top 5 priority prospects, give ONE actionable 2-sentence recommendation for what to focus on today to close deals fastest:\n\n${topProspects}\n\nBe specific and direct. No fluff.`
        );
        aiInsight = result.response.text().trim();
      } catch {}
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, 15),
      aiInsight,
    });
  } catch (error) {
    console.error('GET /api/suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
