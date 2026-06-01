import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Template } from '@/models/Template';
import { validateBody, templateSchema } from '@/lib/validate';
import { logger } from '@/lib/logger';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const validation = validateBody(templateSchema, body);
    if (!validation.success) return validation.response;
    const { name, description, category, steps } = validation.data;

    await connectDB();

    const template = await Template.findOneAndUpdate(
      { _id: id, userId, isDefault: false },
      {
        name,
        description: description || '',
        category: category || 'cold_outreach',
        steps: steps?.map((s: any, i: number) => ({
          stepNumber: i + 1,
          subject: s.subject,
          body: s.body,
          delayDays: s.delayDays || 3,
        })),
      },
      { new: true }
    ).lean();

    if (!template) {
      return NextResponse.json({ error: 'Template not found or is a default template' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    logger.error('PUT /api/templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const template = await Template.findOneAndDelete({ _id: id, userId, isDefault: false });
    if (!template) {
      return NextResponse.json({ error: 'Template not found or is a default template' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DELETE /api/templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
