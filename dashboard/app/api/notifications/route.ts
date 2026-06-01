import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Interaction } from '@/models/Interaction';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const interactions = await Interaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('prospectId', 'firstName lastName company')
    .lean();

  const notifications = interactions.map((i: any) => {
    const prospect = i.prospectId;
    const name = prospect ? `${prospect.firstName} ${prospect.lastName}` : 'Unknown';
    const company = prospect?.company || '';

    let type: string = 'system';
    let title = '';
    let description = '';

    switch (i.type) {
      case 'reply_received':
        type = 'reply';
        title = 'New reply received';
        description = i.classification === 'POSITIVE'
          ? `${name} from ${company} replied positively`
          : i.classification === 'NEGATIVE'
          ? `${name} from ${company} replied negatively`
          : `${name} from ${company} replied`;
        break;
      case 'meeting_scheduled':
        type = 'meeting';
        title = 'Meeting scheduled';
        description = `${name} from ${company} confirmed a meeting`;
        break;
      case 'email_sent':
        type = 'campaign';
        title = 'Email sent';
        description = `Sent to ${name} at ${company}`;
        break;
      case 'deal_closed':
        type = 'deal';
        title = 'Deal closed';
        description = `Deal closed with ${name} at ${company}`;
        break;
      case 'unsubscribe':
        type = 'system';
        title = 'Unsubscribe';
        description = `${name} from ${company} unsubscribed`;
        break;
    }

    return {
      id: i._id.toString(),
      type,
      title,
      description,
      time: i.createdAt,
      read: false,
    };
  });

  return NextResponse.json({ notifications });
}
