import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Prospect } from '@/models/Prospect';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'prospects';

    await connectDB();

    if (type === 'prospects') {
      const prospects = await Prospect.find({ userId }).lean();

      const headers = ['First Name', 'Last Name', 'Email', 'Title', 'Company', 'Industry', 'Tech Stack', 'Status', 'Score', 'Company Size', 'Funding'];
      const rows = prospects.map(p => [
        p.firstName,
        p.lastName,
        p.email,
        p.title,
        p.company,
        p.industry,
        (p.techStack || []).join('; '),
        p.status,
        p.score ?? '',
        p.companySize ?? '',
        p.funding || '',
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="prospects-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  } catch (error) {
    logger.error('GET /api/export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
