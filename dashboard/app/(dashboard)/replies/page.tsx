import Header from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

const mockReplies = [
  {
    id: '1',
    from: 'Sarah Kim',
    company: 'TechVentures',
    subject: 'Re: Quick question about your React stack',
    preview: 'Hi Alex, thanks for reaching out! We are actually looking for a development partner to help us scale our mobile app. Would love to chat...',
    classification: 'POSITIVE',
    confidence: 0.95,
    time: '2 minutes ago',
    autoReplied: true,
  },
  {
    id: '2',
    from: 'Mike Johnson',
    company: 'GrowthLab',
    subject: 'Re: Congrats on the Series A',
    preview: 'Appreciate the note. What kind of timeline are we looking at for an MVP? We have a Q3 deadline...',
    classification: 'POSITIVE',
    confidence: 0.88,
    time: '1 hour ago',
    autoReplied: true,
  },
  {
    id: '3',
    from: 'Emily Chen',
    company: 'DataFlow',
    subject: 'Re: AI-enhanced tools for your platform',
    preview: 'Interesting, but we already have an in-house team. Can you share some case studies of similar work?',
    classification: 'NEUTRAL',
    confidence: 0.72,
    time: '3 hours ago',
    autoReplied: false,
  },
  {
    id: '4',
    from: 'Robert Lee',
    company: 'QuickShip',
    subject: 'Re: Mobile app development',
    preview: 'Not interested at this time, please remove me from your list.',
    classification: 'NEGATIVE',
    confidence: 0.97,
    time: '5 hours ago',
    autoReplied: true,
  },
  {
    id: '5',
    from: 'Jennifer Wu',
    company: 'EduTech',
    subject: 'Re: Cross-platform development',
    preview: 'Thanks for the email. We might be interested next quarter. Can you follow up in September?',
    classification: 'NEUTRAL',
    confidence: 0.65,
    time: 'Yesterday',
    autoReplied: false,
  },
];

const classificationConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  POSITIVE: { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Positive' },
  NEUTRAL: { color: 'text-amber-600 bg-amber-50', icon: Clock, label: 'Neutral' },
  NEGATIVE: { color: 'text-red-600 bg-red-50', icon: XCircle, label: 'Negative' },
};

export default function RepliesPage() {
  return (
    <>
      <Header title="Replies" />
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-xs text-gray-500">Positive</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">7</p>
              <p className="text-xs text-gray-500">Neutral</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">4</p>
              <p className="text-xs text-gray-500">Negative</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">2</p>
              <p className="text-xs text-gray-500">Needs Review</p>
            </div>
          </div>
        </div>

        {/* Reply List */}
        <div className="card p-0 divide-y divide-gray-100">
          {mockReplies.map((reply) => {
            const config = classificationConfig[reply.classification];
            const Icon = config.icon;
            return (
              <div key={reply.id} className="p-5 hover:bg-gray-50/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{reply.from}</p>
                        <span className="text-xs text-gray-400">at {reply.company}</span>
                        {!reply.autoReplied && (
                          <Badge variant="warning">Needs Review</Badge>
                        )}
                        {reply.autoReplied && (
                          <Badge variant="success">Auto-replied</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{reply.subject}</p>
                      <p className="text-sm text-gray-500 mt-1 truncate">{reply.preview}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{reply.time}</span>
                        <span className="text-xs text-gray-400">Confidence: {(reply.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium flex-shrink-0 ml-4">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
