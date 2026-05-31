'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users, Mail, MessageSquare, Calendar, TrendingUp, Zap,
  Loader2, RefreshCw, CheckCircle, Send, ArrowRight, Target, Lightbulb,
} from 'lucide-react';
import { PerformanceChart } from '@/components/ui/PerformanceChart';

interface Stats {
  overview: {
    totalProspects: number;
    emailsSent: number;
    replies: number;
    meetings: number;
    closedDeals: number;
    activeCampaigns: number;
    replyRate: string;
  };
  statusBreakdown: Record<string, number>;
}

interface Activity {
  _id: string;
  type: string;
  subject: string;
  body: string;
  classification?: string;
  autoReplied?: boolean;
  createdAt: string;
  prospect?: { firstName: string; lastName: string; company: string } | null;
}

interface Suggestion {
  prospectId: string;
  firstName: string;
  lastName: string;
  company: string;
  status: string;
  score?: number;
  priority: number;
  reason: string;
  daysSinceContact: number | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [aiInsight, setAiInsight] = useState('');
  const [deals, setDeals] = useState<{ totalRevenue: number; totalDeals: number; goal: number }>({ totalRevenue: 0, totalDeals: 0, goal: 2 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cronResult, setCronResult] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, activityRes, suggestionsRes, dealsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/activity?limit=10'),
        fetch('/api/suggestions'),
        fetch('/api/deals'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (activityRes.ok) {
        const data = await activityRes.json();
        setActivity(data.activities || []);
      }
      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestions(data.suggestions || []);
        setAiInsight(data.aiInsight || '');
      }
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDeals(data.summary || { totalRevenue: 0, totalDeals: 0, goal: 2 });
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleRunCron() {
    setProcessing(true);
    setCronResult('');
    try {
      const res = await fetch('/api/cron', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const parts: string[] = [];
      if (data.replies) {
        parts.push(`Replies: checked ${data.replies.checked || 0}, auto-replied ${data.replies.autoReplied || 0}`);
      }
      if (data.followUps) {
        parts.push(`Follow-ups: sent ${data.followUps.sent || 0}`);
      }
      setCronResult(parts.join(' | ') || 'Done — no pending work');
      fetchData();
    } catch (err: any) {
      setCronResult(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }

  const overview = stats?.overview;
  const statusBreakdown = stats?.statusBreakdown || {};

  const pipelineStages = [
    { label: 'New', count: statusBreakdown['new'] || 0, color: 'bg-[#468faf]' },
    { label: 'Contacted', count: statusBreakdown['contacted'] || 0, color: 'bg-[#2c7da0]' },
    { label: 'Replied', count: statusBreakdown['replied'] || 0, color: 'bg-[#2a6f97]' },
    { label: 'Meeting', count: statusBreakdown['meeting_scheduled'] || 0, color: 'bg-[#014f86]' },
    { label: 'Closed', count: statusBreakdown['closed'] || 0, color: 'bg-emerald-500' },
  ];

  const totalPipeline = pipelineStages.reduce((a, b) => a + b.count, 0) || 1;

  function getActivityIcon(type: string) {
    switch (type) {
      case 'email_sent': return <Send className="h-4 w-4 text-brand-600" />;
      case 'reply_received': return <MessageSquare className="h-4 w-4 text-emerald-600" />;
      case 'meeting_scheduled': return <Calendar className="h-4 w-4 text-amber-600" />;
      default: return <Zap className="h-4 w-4 text-gray-400" />;
    }
  }

  function getActivityLabel(a: Activity) {
    const name = a.prospect ? `${a.prospect.firstName} ${a.prospect.lastName}` : 'Unknown';
    switch (a.type) {
      case 'email_sent': return `Sent email to ${name}`;
      case 'reply_received': return `${name} replied${a.classification ? ` (${a.classification.toLowerCase()})` : ''}`;
      case 'meeting_scheduled': return `Meeting scheduled with ${name}`;
      default: return `Interaction with ${name}`;
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Process button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-500">
              {overview?.activeCampaigns || 0} active campaign{(overview?.activeCampaigns || 0) !== 1 ? 's' : ''}
            </h2>
          </div>
          <button
            onClick={handleRunCron}
            disabled={processing}
            className="btn-primary gap-2 disabled:opacity-50"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {processing ? 'Processing...' : 'Process Now'}
          </button>
        </div>

        {cronResult && (
          <div className={`rounded-lg border p-3 text-sm ${cronResult.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {cronResult}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overview?.totalProspects || 0}</p>
              <p className="text-xs text-gray-500">Total Prospects</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center">
              <Mail className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overview?.emailsSent || 0}</p>
              <p className="text-xs text-gray-500">Emails Sent</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overview?.replies || 0}</p>
              <p className="text-xs text-gray-500">Replies · {overview?.replyRate || '0%'} rate</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overview?.meetings || 0}</p>
              <p className="text-xs text-gray-500">Meetings Booked</p>
            </div>
          </div>
        </div>

        {/* Goal Tracker + AI Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Goal: Close {deals.goal} Clients</h2>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#2a6f97] to-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min((deals.totalDeals / deals.goal) * 100, 100)}%` }} />
              </div>
              <span className="text-lg font-bold text-gray-900">{deals.totalDeals}/{deals.goal}</span>
            </div>
            {deals.totalRevenue > 0 && (
              <p className="text-sm text-gray-600">Total revenue: <span className="font-semibold text-emerald-600">${deals.totalRevenue.toLocaleString()}</span></p>
            )}
            {deals.totalDeals >= deals.goal ? (
              <p className="text-sm font-medium text-emerald-600 mt-2">Goal achieved!</p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">{deals.goal - deals.totalDeals} more client{deals.goal - deals.totalDeals !== 1 ? 's' : ''} to go</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Smart Suggestions</h2>
            </div>
            {aiInsight && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-3">
                <p className="text-sm text-amber-800">{aiInsight}</p>
              </div>
            )}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suggestions.slice(0, 5).map(s => (
                <div key={s.prospectId} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName} · {s.company}</p>
                    <p className="text-xs text-gray-500">{s.reason}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    s.priority >= 80 ? 'bg-red-50 text-red-700' :
                    s.priority >= 60 ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{s.priority}</span>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No suggestions yet — add prospects first</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Deal Pipeline</h2>
              <span className="text-sm text-gray-500">{overview?.totalProspects || 0} total</span>
            </div>
            {(overview?.totalProspects || 0) === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title="No prospects yet"
                description="Discover prospects to start building your pipeline."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex h-8 rounded-lg overflow-hidden">
                  {pipelineStages.map(stage => (
                    stage.count > 0 && (
                      <div
                        key={stage.label}
                        className={`${stage.color} flex items-center justify-center text-xs font-medium text-white transition-all`}
                        style={{ width: `${(stage.count / totalPipeline) * 100}%`, minWidth: stage.count > 0 ? '40px' : '0' }}
                      >
                        {stage.count}
                      </div>
                    )
                  ))}
                </div>
                <div className="flex flex-wrap gap-4">
                  {pipelineStages.map(stage => (
                    <div key={stage.label} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                      <span className="text-sm text-gray-600">{stage.label}</span>
                      <span className="text-sm font-medium text-gray-900">{stage.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{statusBreakdown['contacted'] || 0} contacted</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{statusBreakdown['replied'] || 0} replied</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{statusBreakdown['meeting_scheduled'] || 0} meetings</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-medium text-emerald-600">{statusBreakdown['closed'] || 0} closed</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <EmptyState
                icon={<Zap className="h-8 w-8" />}
                title="No activity yet"
                description="Activity will appear once you start campaigns."
              />
            ) : (
              <div className="space-y-3">
                {activity.map(a => (
                  <div key={a._id} className="flex items-start gap-3">
                    <div className="mt-0.5">{getActivityIcon(a.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{getActivityLabel(a)}</p>
                      {a.subject && <p className="text-xs text-gray-400 truncate">{a.subject}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{overview?.replyRate || '0%'}</p>
              <p className="text-sm text-gray-500 mt-1">Reply Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {overview && overview.replies > 0
                  ? `${((overview.meetings / overview.replies) * 100).toFixed(0)}%`
                  : '0%'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Reply → Meeting</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{overview?.activeCampaigns || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Active Campaigns</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{overview?.closedDeals || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Deals Closed</p>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Weekly Performance</h2>
          <PerformanceChart />
        </div>
      </div>
    </>
  );
}
