import Header from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/Badge';
import { Mail, Plus, Play, Pause, BarChart3 } from 'lucide-react';

const mockCampaigns = [
  { id: '1', name: 'SaaS Founders - Series A', status: 'active', sent: 45, replies: 12, meetings: 3, replyRate: '26.7%', created: 'May 25, 2026' },
  { id: '2', name: 'E-commerce CTOs', status: 'active', sent: 30, replies: 8, meetings: 2, replyRate: '26.7%', created: 'May 27, 2026' },
  { id: '3', name: 'FinTech VP Engineering', status: 'draft', sent: 0, replies: 0, meetings: 0, replyRate: '—', created: 'May 30, 2026' },
  { id: '4', name: 'HealthTech Startups', status: 'paused', sent: 14, replies: 3, meetings: 0, replyRate: '21.4%', created: 'May 20, 2026' },
  { id: '5', name: 'DevTools Founders', status: 'completed', sent: 50, replies: 11, meetings: 2, replyRate: '22.0%', created: 'May 15, 2026' },
];

export default function CampaignsPage() {
  return (
    <>
      <Header title="Campaigns" />
      <div className="p-6 space-y-6">
        {/* Top Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Manage your email outreach campaigns. Each campaign targets a specific audience with personalized messaging.
          </p>
          <button className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockCampaigns.map((campaign) => (
            <div key={campaign.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{campaign.name}</h3>
                    <p className="text-xs text-gray-500">Created {campaign.created}</p>
                  </div>
                </div>
                <StatusBadge status={campaign.status} />
              </div>

              <div className="mt-5 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sent</p>
                  <p className="text-lg font-semibold text-gray-900">{campaign.sent}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Replies</p>
                  <p className="text-lg font-semibold text-gray-900">{campaign.replies}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Meetings</p>
                  <p className="text-lg font-semibold text-gray-900">{campaign.meetings}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reply Rate</p>
                  <p className="text-lg font-semibold text-green-600">{campaign.replyRate}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                {campaign.status === 'active' && (
                  <button className="btn-secondary text-xs px-3 py-1.5 gap-1.5">
                    <Pause className="h-3.5 w-3.5" />
                    Pause
                  </button>
                )}
                {(campaign.status === 'draft' || campaign.status === 'paused') && (
                  <button className="btn-primary text-xs px-3 py-1.5 gap-1.5">
                    <Play className="h-3.5 w-3.5" />
                    {campaign.status === 'draft' ? 'Launch' : 'Resume'}
                  </button>
                )}
                <button className="btn-secondary text-xs px-3 py-1.5 gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
