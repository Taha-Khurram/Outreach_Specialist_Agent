'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import {
  ArrowLeft, Mail, MessageSquare, Calendar, Users,
  Loader2, TrendingUp, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface Analytics {
  campaign: { name: string; status: string; createdAt: string };
  metrics: {
    totalProspects: number;
    emailsSent: number;
    repliesReceived: number;
    meetingsBooked: number;
    replyRate: string;
    meetingRate: string;
  };
  classifications: Record<string, number>;
  prospectStatuses: Record<string, number>;
  stepPerformance: { stepNumber: number; subject: string; sent: number; deliveryRate: string }[];
  timeline: { date: string; sent: number; replies: number }[];
}

export default function CampaignAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/campaigns/${id}/analytics`);
        if (res.ok) setData(await res.json());
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header title="Campaign Analytics" />
        <div className="p-6 flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header title="Campaign Analytics" />
        <div className="p-6">
          <p className="text-gray-500">Campaign not found.</p>
        </div>
      </>
    );
  }

  const { campaign, metrics, classifications, prospectStatuses, stepPerformance, timeline } = data;

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    replied: 'bg-green-100 text-green-700',
    bounced: 'bg-red-100 text-red-700',
    unsubscribed: 'bg-gray-100 text-gray-600',
  };

  return (
    <>
      <Header title="Campaign Analytics" />
      <div className="p-6 space-y-6">
        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/campaigns')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-sm text-gray-500">
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)} · Started {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalProspects}</p>
              <p className="text-xs text-gray-500">Prospects</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.emailsSent}</p>
              <p className="text-xs text-gray-500">Emails Sent</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.repliesReceived}</p>
              <p className="text-xs text-gray-500">Replies ({metrics.replyRate})</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.meetingsBooked}</p>
              <p className="text-xs text-gray-500">Meetings ({metrics.meetingRate})</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity (14 days)</h2>
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="sent" fill="#8b5cf6" name="Sent" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="replies" fill="#10b981" name="Replies" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No activity data yet</p>
            )}
          </div>

          {/* Prospect Status Breakdown */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prospect Status</h2>
            <div className="space-y-3">
              {Object.entries(prospectStatuses).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${(count / metrics.totalProspects) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Performance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Step</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Subject</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Sent</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Delivery %</th>
                </tr>
              </thead>
              <tbody>
                {stepPerformance.map(step => (
                  <tr key={step.stepNumber} className="border-b border-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">#{step.stepNumber}</td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-[200px]">{step.subject}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{step.sent}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {step.deliveryRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reply Classifications */}
        {Object.keys(classifications).length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reply Sentiment</h2>
            <div className="flex gap-4">
              {Object.entries(classifications).map(([cls, count]) => {
                const colors: Record<string, string> = {
                  POSITIVE: 'bg-green-100 text-green-700',
                  NEUTRAL: 'bg-amber-100 text-amber-700',
                  NEGATIVE: 'bg-red-100 text-red-700',
                  UNSUBSCRIBE: 'bg-gray-100 text-gray-700',
                };
                return (
                  <div key={cls} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colors[cls] || 'bg-gray-100 text-gray-700'}`}>
                    <span className="text-lg font-bold">{count}</span>
                    <span className="text-sm">{cls.toLowerCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
