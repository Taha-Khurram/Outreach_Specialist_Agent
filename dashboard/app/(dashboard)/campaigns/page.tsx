'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Mail, Plus, Edit2, Trash2, X, Loader2, Play, Pause, BarChart3, FileText,
} from 'lucide-react';

interface CampaignStep {
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
}

interface Campaign {
  _id: string;
  name: string;
  status: string;
  steps: CampaignStep[];
  prospects: any[];
  settings: { dailyLimit: number; sendWindow: { start: number; end: number } };
  stats: { totalSent: number; totalReplies: number; totalMeetings: number };
  createdAt: string;
  updatedAt: string;
}

interface ProspectOption {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [name, setName] = useState('');
  const [steps, setSteps] = useState<CampaignStep[]>([{ stepNumber: 1, subject: '', body: '', delayDays: 0 }]);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [availableProspects, setAvailableProspects] = useState<ProspectOption[]>([]);
  const [prospectSearch, setProspectSearch] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCampaigns(data.campaigns);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch('/api/prospects?limit=200');
      if (!res.ok) return;
      const data = await res.json();
      setAvailableProspects(data.prospects);
    } catch {}
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {}
  }

  function applyTemplate(template: any) {
    setSteps(template.steps.map((s: any) => ({
      stepNumber: s.stepNumber,
      subject: s.subject,
      body: s.body,
      delayDays: s.delayDays,
    })));
    if (!name) setName(template.name);
    setShowTemplatePicker(false);
  }

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setSteps([{ stepNumber: 1, subject: '', body: '', delayDays: 0 }]);
    setDailyLimit(20);
    setSelectedProspects([]);
    setError('');
    setShowModal(true);
    fetchProspects();
    fetchTemplates();
  }

  function openEdit(campaign: Campaign) {
    setEditingId(campaign._id);
    setName(campaign.name);
    setSteps(campaign.steps.length ? campaign.steps : [{ stepNumber: 1, subject: '', body: '', delayDays: 0 }]);
    setDailyLimit(campaign.settings?.dailyLimit || 20);
    setSelectedProspects(campaign.prospects.map((p: any) => p.prospectId || p));
    setError('');
    setShowModal(true);
    fetchProspects();
  }

  function addStep() {
    setSteps([...steps, { stepNumber: steps.length + 1, subject: '', body: '', delayDays: 3 }]);
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(updated);
  }

  function updateStep(index: number, field: keyof CampaignStep, value: any) {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  }

  function toggleProspect(id: string) {
    setSelectedProspects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Campaign name is required'); return; }
    if (!steps[0]?.subject || !steps[0]?.body) { setError('Step 1 must have a subject and body'); return; }
    if (selectedProspects.length === 0) { setError('Select at least one prospect'); return; }

    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      steps,
      prospectIds: selectedProspects,
      settings: { dailyLimit, sendWindow: { start: 9, end: 17 } },
    };

    try {
      const url = editingId ? `/api/campaigns/${editingId}` : '/api/campaigns';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setShowModal(false);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLaunch(id: string) {
    if (!confirm('Launch this campaign? Emails will be sent to all assigned prospects.')) return;
    setLaunching(id);
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/campaigns/${id}/launch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Launch failed');
      setSuccessMsg(`Campaign launched! ${data.sent} emails sent, ${data.failed} failed.`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLaunching(null);
    }
  }

  async function handlePause(id: string) {
    try {
      const res = await fetch(`/api/campaigns/${id}/pause`, { method: 'POST' });
      if (!res.ok) throw new Error();
      fetchCampaigns();
    } catch {
      alert('Failed to pause campaign');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  }

  const filteredProspects = prospectSearch
    ? availableProspects.filter(p => {
        const q = prospectSearch.toLowerCase();
        return p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
      })
    : availableProspects;

  return (
    <>
      <Header title="Campaigns" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Create and manage email sequences for your prospects.</p>
          <button onClick={openCreate} className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>

        {successMsg && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
            {successMsg}
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<Mail className="h-8 w-8" />}
                title="No campaigns yet"
                description="Create your first email campaign to start reaching out to prospects."
                action={<button onClick={openCreate} className="btn-primary gap-2"><Plus className="h-4 w-4" /> New Campaign</button>}
              />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Campaign</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Steps</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Prospects</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Sent</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Replies</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.steps.length}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.prospects.length}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.stats.totalSent}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.stats.totalReplies}</td>
                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {(c.status === 'draft' || c.status === 'paused') && (
                          <>
                            <button onClick={() => handleLaunch(c._id)} disabled={launching === c._id} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Launch">
                              {launching === c._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            </button>
                            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {c.status === 'active' && (
                          <button onClick={() => handlePause(c._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Pause">
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        <a href={`/campaigns/${c._id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Analytics">
                          <BarChart3 className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Campaign Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}

              {/* Template Picker */}
              {!editingId && (
                <div>
                  <button type="button" onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                    className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700">
                    <FileText className="h-4 w-4" /> Use a Template
                  </button>
                  {showTemplatePicker && templates.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto bg-white">
                      {templates.map((t: any) => (
                        <button key={t._id} type="button" onClick={() => applyTemplate(t)}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors">
                          <div className="text-sm font-medium text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.description} · {t.steps.length} steps</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Q1 Outreach - SaaS CTOs" className="input-field" />
              </div>

              {/* Email Steps */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Email Sequence</label>
                  <button type="button" onClick={addStep} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Follow-up
                  </button>
                </div>

                <div className="space-y-4">
                  {steps.map((step, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Step {step.stepNumber}: {i === 0 ? 'Initial Email' : `Follow-up ${i}`}
                        </span>
                        <div className="flex items-center gap-3">
                          {i > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500">Wait</span>
                              <input
                                type="number"
                                min={1}
                                value={step.delayDays}
                                onChange={e => updateStep(i, 'delayDays', Number(e.target.value))}
                                className="w-14 px-2 py-1 text-xs border border-gray-200 rounded"
                              />
                              <span className="text-xs text-gray-500">days</span>
                            </div>
                          )}
                          {steps.length > 1 && (
                            <button type="button" onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={step.subject}
                        onChange={e => updateStep(i, 'subject', e.target.value)}
                        placeholder="Subject line — use {{firstName}}, {{company}}"
                        className="input-field text-sm"
                      />
                      <textarea
                        value={step.body}
                        onChange={e => updateStep(i, 'body', e.target.value)}
                        placeholder="Email body — use {{firstName}}, {{company}}, {{title}}, {{industry}}, {{techStack}}"
                        rows={4}
                        className="input-field text-sm resize-none"
                      />
                      <p className="text-xs text-gray-400">Variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{company}}'}, {'{{title}}'}, {'{{industry}}'}, {'{{techStack}}'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prospect Selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Prospects ({selectedProspects.length} selected)
                </label>
                <input
                  type="text"
                  value={prospectSearch}
                  onChange={e => setProspectSearch(e.target.value)}
                  placeholder="Search prospects..."
                  className="input-field text-sm mb-2"
                />
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-white">
                  {filteredProspects.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400 text-center">No prospects found. Discover or add prospects first.</p>
                  ) : (
                    filteredProspects.map(p => (
                      <label key={p._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={selectedProspects.includes(p._id)}
                          onChange={() => toggleProspect(p._id)}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-900">{p.firstName} {p.lastName}</span>
                          <span className="text-xs text-gray-400 ml-2">{p.company}</span>
                        </div>
                        <span className="text-xs text-gray-400 truncate">{p.email}</span>
                      </label>
                    ))
                  )}
                </div>
                {availableProspects.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => setSelectedProspects(availableProspects.map(p => p._id))} className="text-xs text-brand-600 hover:text-brand-700">Select All</button>
                    <button type="button" onClick={() => setSelectedProspects([])} className="text-xs text-gray-500 hover:text-gray-700">Clear All</button>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Daily Send Limit</label>
                <input type="number" min={1} max={100} value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} className="input-field w-24 text-sm" />
                <p className="text-xs text-gray-400 mt-1">Maximum emails sent per day for this campaign.</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary gap-2 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
