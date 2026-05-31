import Header from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Users, Mail, MessageSquare, Calendar, TrendingUp, Target } from 'lucide-react';

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Prospects"
            value="142"
            change="+12 this week"
            changeType="positive"
            icon={Users}
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Emails Sent"
            value="89"
            change="18 today"
            changeType="positive"
            icon={Mail}
            iconColor="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Replies"
            value="23"
            change="25.8% rate"
            changeType="positive"
            icon={MessageSquare}
            iconColor="bg-green-100 text-green-600"
          />
          <StatCard
            title="Meetings Booked"
            value="5"
            change="2 this week"
            changeType="positive"
            icon={Calendar}
            iconColor="bg-amber-100 text-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Deal Pipeline</h2>
              <button className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</button>
            </div>
            <div className="space-y-4">
              <PipelineRow name="Sarah Kim" company="TechVentures" title="CTO" status="meeting" date="Today, 2:00 PM" />
              <PipelineRow name="Mike Johnson" company="GrowthLab" title="CEO" status="replied" date="Yesterday" />
              <PipelineRow name="Emily Chen" company="DataFlow" title="VP Engineering" status="replied" date="May 29" />
              <PipelineRow name="James Park" company="ShipFast" title="Founder" status="contacted" date="May 28" />
              <PipelineRow name="Lisa Wang" company="CloudScale" title="Head of Product" status="contacted" date="May 28" />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              <ActivityItem
                icon={<MessageSquare className="h-4 w-4" />}
                color="bg-green-100 text-green-600"
                text="Positive reply from Sarah Kim"
                time="2m ago"
              />
              <ActivityItem
                icon={<Mail className="h-4 w-4" />}
                color="bg-purple-100 text-purple-600"
                text="5 emails sent to new prospects"
                time="15m ago"
              />
              <ActivityItem
                icon={<Calendar className="h-4 w-4" />}
                color="bg-amber-100 text-amber-600"
                text="Meeting scheduled with TechVentures"
                time="1h ago"
              />
              <ActivityItem
                icon={<Users className="h-4 w-4" />}
                color="bg-blue-100 text-blue-600"
                text="12 new prospects discovered"
                time="3h ago"
              />
              <ActivityItem
                icon={<Target className="h-4 w-4" />}
                color="bg-red-100 text-red-600"
                text="Campaign 'SaaS Founders' completed"
                time="5h ago"
              />
            </div>
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
              <p className="mt-2 text-sm text-gray-500">Performance chart renders here</p>
              <p className="text-xs text-gray-400">Install recharts and connect real data</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PipelineRow({ name, company, title, status, date }: { name: string; company: string; title: string; status: string; date: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{title} at {company}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        <span className="text-xs text-gray-400">{date}</span>
      </div>
    </div>
  );
}

function ActivityItem({ icon, color, text, time }: { icon: React.ReactNode; color: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{text}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}
