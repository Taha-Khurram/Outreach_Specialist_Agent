import Header from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DiscoverButton } from '@/components/ui/DiscoverButton';
import { Users, Mail, MessageSquare, Calendar, TrendingUp, Zap } from 'lucide-react';

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Prospects"
            value="0"
            icon={Users}
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Emails Sent"
            value="0"
            icon={Mail}
            iconColor="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Replies"
            value="0"
            icon={MessageSquare}
            iconColor="bg-green-100 text-green-600"
          />
          <StatCard
            title="Meetings Booked"
            value="0"
            icon={Calendar}
            iconColor="bg-amber-100 text-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Deal Pipeline</h2>
            </div>
            <EmptyState
              icon={<TrendingUp className="h-8 w-8" />}
              title="No deals yet"
              description="Run the discovery agent to find prospects and start building your pipeline."
              action={<DiscoverButton />}
            />
          </div>

          {/* Activity Feed */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <EmptyState
              icon={<Zap className="h-8 w-8" />}
              title="No activity yet"
              description="Activity will appear here once the agent starts working."
            />
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Performance</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-brand-700">7 days</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:bg-gray-50">30 days</button>
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 hover:bg-gray-50">90 days</button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">No data yet</p>
              <p className="text-xs text-gray-400">Charts will populate as emails are sent</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
