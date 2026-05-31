'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import ScoreBadge from '@/components/ui/ScoreBadge';
import {
  Loader2, Search, ArrowRight, Mail, Calendar,
  CheckCircle2, UserPlus, MessageSquare,
} from 'lucide-react';

interface Prospect {
  _id: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  status: string;
  score?: number;
  lastContactedAt?: string;
  updatedAt: string;
}

const STAGES = [
  { key: 'new', label: 'New', icon: UserPlus, color: 'border-gray-200 bg-gray-50' },
  { key: 'contacted', label: 'Contacted', icon: Mail, color: 'border-blue-200 bg-blue-50' },
  { key: 'replied', label: 'Replied', icon: MessageSquare, color: 'border-purple-200 bg-purple-50' },
  { key: 'meeting', label: 'Meeting', icon: Calendar, color: 'border-amber-200 bg-amber-50' },
  { key: 'closed', label: 'Closed', icon: CheckCircle2, color: 'border-green-200 bg-green-50' },
];

export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);

  useEffect(() => {
    fetchProspects();
  }, []);

  async function fetchProspects() {
    try {
      const res = await fetch('/api/prospects?limit=500');
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function moveProspect(prospectId: string, newStatus: string) {
    setMoving(prospectId);
    try {
      const res = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProspects(prev =>
          prev.map(p => p._id === prospectId ? { ...p, status: newStatus } : p)
        );
      }
    } catch {} finally {
      setMoving(null);
    }
  }

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage.key] = prospects
      .filter(p => p.status === stage.key)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    return acc;
  }, {} as Record<string, Prospect[]>);

  const totalInPipeline = prospects.filter(p => !['unsubscribed', 'bounced'].includes(p.status)).length;
  const conversionRate = totalInPipeline > 0
    ? ((grouped['closed']?.length || 0) / totalInPipeline * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <>
        <Header title="Pipeline" />
        <div className="p-6 flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Pipeline" />
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STAGES.map(stage => (
            <div key={stage.key} className={`rounded-lg border p-3 ${stage.color}`}>
              <div className="flex items-center gap-2">
                <stage.icon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{stage.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{grouped[stage.key]?.length || 0}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {totalInPipeline} prospects in pipeline · {conversionRate}% conversion rate
          </p>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {STAGES.map((stage, stageIdx) => (
            <div key={stage.key} className="min-w-[220px]">
              <div className={`rounded-t-lg border-t-4 ${
                stage.key === 'new' ? 'border-t-gray-400' :
                stage.key === 'contacted' ? 'border-t-blue-400' :
                stage.key === 'replied' ? 'border-t-purple-400' :
                stage.key === 'meeting' ? 'border-t-amber-400' :
                'border-t-green-400'
              } bg-gray-50 px-3 py-2`}>
                <h3 className="text-sm font-semibold text-gray-700">{stage.label}</h3>
                <p className="text-xs text-gray-500">{grouped[stage.key]?.length || 0} prospects</p>
              </div>
              <div className="space-y-2 mt-2 max-h-[600px] overflow-y-auto">
                {(grouped[stage.key] || []).map(prospect => (
                  <div
                    key={prospect._id}
                    className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {prospect.firstName} {prospect.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{prospect.company}</p>
                        <p className="text-xs text-gray-400 truncate">{prospect.title}</p>
                      </div>
                      <ScoreBadge score={prospect.score} />
                    </div>
                    {prospect.lastContactedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        Last contact: {new Date(prospect.lastContactedAt).toLocaleDateString()}
                      </p>
                    )}
                    {/* Move buttons */}
                    {stageIdx < STAGES.length - 1 && (
                      <button
                        onClick={() => moveProspect(prospect._id, STAGES[stageIdx + 1].key)}
                        disabled={moving === prospect._id}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded py-1 transition-colors disabled:opacity-50"
                      >
                        {moving === prospect._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            Move to {STAGES[stageIdx + 1].label}
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
                {(!grouped[stage.key] || grouped[stage.key].length === 0) && (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No prospects
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
