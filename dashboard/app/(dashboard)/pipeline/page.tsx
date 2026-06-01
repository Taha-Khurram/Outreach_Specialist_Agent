'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import ScoreBadge from '@/components/ui/ScoreBadge';
import {
  Loader2, Search, ArrowRight, Mail, Calendar,
  CheckCircle2, UserPlus, MessageSquare, X, DollarSign, Download,
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
  { key: 'contacted', label: 'Contacted', icon: Mail, color: 'border-brand-200 bg-brand-50' },
  { key: 'replied', label: 'Replied', icon: MessageSquare, color: 'border-purple-200 bg-purple-50' },
  { key: 'meeting', label: 'Meeting', icon: Calendar, color: 'border-amber-200 bg-amber-50' },
  { key: 'closed', label: 'Closed', icon: CheckCircle2, color: 'border-emerald-200 bg-emerald-50' },
];

export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealProspect, setDealProspect] = useState<Prospect | null>(null);
  const [dealValue, setDealValue] = useState('');
  const [dealNotes, setDealNotes] = useState('');
  const [dealSaving, setDealSaving] = useState(false);
  const [dealCurrency, setDealCurrency] = useState('USD');
  const [dealServices, setDealServices] = useState('');
  const [dealStatus, setDealStatus] = useState<'won' | 'lost' | 'negotiating'>('won');
  const [dealCloseDate, setDealCloseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchProspects();
  }, []);

  async function fetchProspects() {
    try {
      const res = await fetch('/api/prospects?limit=200');
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function moveProspect(prospectId: string, newStatus: string) {
    if (newStatus === 'closed') {
      const prospect = prospects.find(p => p._id === prospectId);
      if (prospect) {
        setDealProspect(prospect);
        setDealValue('');
        setDealNotes('');
        setShowDealModal(true);
      }
      return;
    }
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

  async function handleCloseDeal() {
    if (!dealProspect || !dealValue) return;
    const numValue = Number(dealValue);
    if (isNaN(numValue) || numValue < 0) return;
    setDealSaving(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: dealProspect._id,
          value: Number(dealValue),
          currency: dealCurrency,
          status: dealStatus,
          services: dealServices.split(',').map(s => s.trim()).filter(Boolean),
          closeDate: dealCloseDate,
          notes: dealNotes,
        }),
      });
      if (res.ok) {
        const newStatus = dealStatus === 'won' ? 'closed' : dealProspect.status;
        setProspects(prev =>
          prev.map(p => p._id === dealProspect._id ? { ...p, status: newStatus } : p)
        );
        setShowDealModal(false);
      }
    } catch {} finally {
      setDealSaving(false);
    }
  }

  async function handleExport() {
    const res = await fetch('/api/export?type=prospects');
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prospects-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const grouped = useMemo(() => STAGES.reduce((acc, stage) => {
    acc[stage.key] = prospects
      .filter(p => p.status === stage.key)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    return acc;
  }, {} as Record<string, Prospect[]>), [prospects]);

  const totalInPipeline = useMemo(() => prospects.filter(p => !['unsubscribed', 'bounced'].includes(p.status)).length, [prospects]);
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
          <button onClick={handleExport} className="btn-secondary gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {STAGES.map((stage, stageIdx) => (
            <div key={stage.key} className="min-w-[220px]">
              <div className={`rounded-t-lg border-t-4 ${
                stage.key === 'new' ? 'border-t-gray-400' :
                stage.key === 'contacted' ? 'border-t-[#2c7da0]' :
                stage.key === 'replied' ? 'border-t-purple-400' :
                stage.key === 'meeting' ? 'border-t-amber-400' :
                'border-t-emerald-500'
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

      {/* Close Deal Modal */}
      {showDealModal && dealProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDealModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Close Deal</h2>
              <button onClick={() => setShowDealModal(false)} aria-label="Close modal" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600">
                Closing deal with <strong>{dealProspect.firstName} {dealProspect.lastName}</strong> at {dealProspect.company}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select value={dealStatus} onChange={e => setDealStatus(e.target.value as any)} className="input-field">
                  <option value="won">Won</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)}
                      placeholder="5000" className="input-field pl-9" min="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={dealCurrency} onChange={e => setDealCurrency(e.target.value)} className="input-field">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
                <input type="date" value={dealCloseDate} onChange={e => setDealCloseDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
                <input type="text" value={dealServices} onChange={e => setDealServices(e.target.value)}
                  placeholder="Web dev, Mobile app, API integration" className="input-field" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated list of services sold</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={dealNotes} onChange={e => setDealNotes(e.target.value)}
                  placeholder="Additional context..." rows={3} className="input-field resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowDealModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleCloseDeal} disabled={!dealValue || dealSaving}
                  className="btn-primary gap-2 disabled:opacity-50">
                  {dealSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {dealStatus === 'won' ? 'Close Deal' : dealStatus === 'lost' ? 'Mark Lost' : 'Save Deal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
