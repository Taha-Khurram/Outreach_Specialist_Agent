'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { DiscoverButton } from '@/components/ui/DiscoverButton';
import ScoreBadge from '@/components/ui/ScoreBadge';
import { Users, Plus, Search, Edit2, Trash2, X, Loader2, Sparkles, FlaskConical } from 'lucide-react';

interface Prospect {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  techStack: string[];
  funding: string;
  fundingAmount: number | null;
  companySize: number | null;
  linkedinUrl: string;
  status: string;
  score?: number;
  scoreBreakdown?: { companyFit: number; roleAuthority: number; engagementSignals: number; timing: number; reasoning?: string };
  research?: { summary: string; painPoints: string[]; talkingPoints: string[]; recentNews: string; techNeeds: string[]; researchedAt: string };
  notes: string;
  createdAt: string;
}

const statuses = ['all', 'new', 'contacted', 'replied', 'meeting', 'closed', 'unsubscribed'];

const emptyForm = {
  firstName: '', lastName: '', email: '', title: '', company: '',
  industry: '', techStack: '', companySize: '', linkedinUrl: '', notes: '',
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByScore, setSortByScore] = useState(false);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState('');
  const [researchProspect, setResearchProspect] = useState<Prospect | null>(null);
  const [researching, setResearching] = useState(false);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/prospects?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProspects(data.prospects);
      setTotal(data.pagination.total);
    } catch {
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  let filtered = searchQuery
    ? prospects.filter(p => {
        const q = searchQuery.toLowerCase();
        return p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) || p.company.toLowerCase().includes(q);
      })
    : prospects;

  if (sortByScore) {
    filtered = [...filtered].sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  function openAdd() {
    setEditingId(null); setForm(emptyForm); setError(''); setShowModal(true);
  }

  function openEdit(p: Prospect) {
    setEditingId(p._id);
    setForm({
      firstName: p.firstName, lastName: p.lastName, email: p.email, title: p.title,
      company: p.company, industry: p.industry, techStack: p.techStack.join(', '),
      companySize: p.companySize?.toString() || '', linkedinUrl: p.linkedinUrl, notes: p.notes,
    });
    setError(''); setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.company) {
      setError('First name, email, and company are required.'); return;
    }
    setSaving(true); setError('');
    const payload = {
      firstName: form.firstName, lastName: form.lastName, email: form.email,
      title: form.title, company: form.company, industry: form.industry,
      techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean),
      companySize: form.companySize ? Number(form.companySize) : null,
      linkedinUrl: form.linkedinUrl, notes: form.notes,
    };
    try {
      const url = editingId ? `/api/prospects/${editingId}` : '/api/prospects';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to save'); }
      setShowModal(false); fetchProspects();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this prospect? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      fetchProspects();
    } catch { alert('Failed to delete prospect.'); }
  }

  async function handleScoreAll() {
    setScoring(true); setScoreResult('');
    try {
      const res = await fetch('/api/prospects/score-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setScoreResult(`Scored ${data.scored} prospects`);
        fetchProspects();
      } else {
        setScoreResult(data.error || 'Failed');
      }
    } catch { setScoreResult('Error scoring prospects'); } finally { setScoring(false); }
  }

  async function handleResearch(prospect: Prospect) {
    setResearchProspect(prospect); setResearching(true);
    try {
      const res = await fetch(`/api/prospects/${prospect._id}/research`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResearchProspect({ ...prospect, research: data.research });
        fetchProspects();
      }
    } catch {} finally { setResearching(false); }
  }

  return (
    <>
      <Header title="Prospects" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by name, company, email..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-80 pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleScoreAll} disabled={scoring}
              className="btn-secondary gap-2 disabled:opacity-50">
              {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Score All
            </button>
            <DiscoverButton onComplete={() => fetchProspects()} />
            <button onClick={openAdd} className="btn-primary gap-2">
              <Plus className="h-4 w-4" /> Add Prospect
            </button>
          </div>
        </div>

        {scoreResult && (
          <div className="rounded-lg bg-brand-50 border border-brand-200 p-3 text-sm text-brand-700">{scoreResult}</div>
        )}

        {/* Status Tabs + Sort */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s === 'all' && <span className="ml-1.5 text-xs text-gray-400">{total}</span>}
              </button>
            ))}
          </div>
          <button onClick={() => setSortByScore(!sortByScore)}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${sortByScore ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
            Sort by Score
          </button>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16">
              <EmptyState icon={<Users className="h-8 w-8" />}
                title={searchQuery ? 'No matches found' : 'No prospects yet'}
                description={searchQuery ? 'Try a different search term.' : 'Add prospects manually or run the discovery agent.'}
                action={!searchQuery ? <button onClick={openAdd} className="btn-primary gap-2"><Plus className="h-4 w-4" /> Add Prospect</button> : undefined} />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Prospect</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Score</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Industry</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                      {p.title && <div className="text-xs text-gray-400">{p.title}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{p.company}</div>
                      {p.companySize && <div className="text-xs text-gray-400">{p.companySize} employees</div>}
                    </td>
                    <td className="px-6 py-4"><ScoreBadge score={p.score} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.industry || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleResearch(p)} title="AI Research"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                          <FlaskConical className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Prospect' : 'Add Prospect'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label><input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="CEO, CTO..." className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Company *</label><input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Industry</label><input type="text" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="SaaS, FinTech..." className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label><input type="number" value={form.companySize} onChange={e => setForm({ ...form, companySize: e.target.value })} placeholder="50" className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label><input type="text" value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} placeholder="React, Node.js, AWS (comma-separated)" className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label><input type="url" value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any relevant notes..." className="input-field resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary gap-2 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Research Modal */}
      {researchProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setResearchProspect(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Research: {researchProspect.company}</h2>
                <p className="text-sm text-gray-500">{researchProspect.firstName} {researchProspect.lastName} · {researchProspect.title}</p>
              </div>
              <button onClick={() => setResearchProspect(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              {researching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3" />
                  <p className="text-sm text-gray-500">Researching {researchProspect.company}...</p>
                </div>
              ) : researchProspect.research ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Summary</h3>
                    <p className="text-sm text-gray-600">{researchProspect.research.summary}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Pain Points</h3>
                    <ul className="space-y-1">
                      {researchProspect.research.painPoints.map((p, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Talking Points</h3>
                    <ul className="space-y-1">
                      {researchProspect.research.talkingPoints.map((p, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Tech Needs</h3>
                    <div className="flex flex-wrap gap-2">
                      {researchProspect.research.techNeeds.map((t, i) => (
                        <span key={i} className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">{t}</span>
                      ))}
                    </div>
                  </div>
                  {researchProspect.research.recentNews && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Recent News</h3>
                      <p className="text-sm text-gray-600">{researchProspect.research.recentNews}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FlaskConical className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No research yet for this prospect.</p>
                  <button onClick={() => handleResearch(researchProspect)} className="btn-primary gap-2">
                    <Sparkles className="h-4 w-4" /> Run AI Research
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
