import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

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
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Positive</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Neutral</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Negative</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Needs Review</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="card">
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title="No replies yet"
            description="Replies will appear here once prospects respond to your outreach emails. The AI will automatically classify and handle them."
          />
        </div>
      </div>
    </>
  );
}
