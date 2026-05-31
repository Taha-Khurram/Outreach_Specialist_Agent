'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { DiscoverButton } from '@/components/ui/DiscoverButton';
import { Users, Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';

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
  notes: string;
  createdAt: string;
}

const statuses = ['all', 'new', 'contacted', 'replied', 'meeting', 'closed', 'unsubscribed'];

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  title: '',
  company: '',
  industry: '',
  techStack: '',
  companySize: '',
  linkedinUrl: '',
  notes: '',
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
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

  const filtered = searchQuery
    ? prospects.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q)
        );
      })
    : prospects;

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: Prospect) {
    setEditingId(p._id);
    setForm({
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      title: p.title,
      company: p.company,
      industry: p.industry,
      techStack: p.techStack.join(', '),
      companySize: p.companySize?.toString() || '',
      linkedinUrl: p.linkedinUrl,
      notes: p.notes,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.company) {
      setError('First name, email, and company are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      title: form.title,
      company: form.company,
      industry: form.industry,
      techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean),
      companySize: form.companySize ? Number(form.companySize) : null,
      linkedinUrl: form.linkedinUrl,
      notes: form.notes,
    };

    try {
      const url = editingId ? `/api/prospects/${editingId}` : '/api/prospects';
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
      fetchProspects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this prospect? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      fetchProspects();
    } catch {
      alert('Failed to delete prospect.');
    }
  }

  return (
    <>
      <Header title="Prospects" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-80 pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:border-brand-300 focus:ring-1 focus:ring-brand-300"
            />
          </div>
          <div className="flex items-center gap-3">
            <DiscoverButton onComplete={() => fetchProspects()} />
            <button onClick={openAdd} className="btn-primary gap-2">
              <Plus className="h-4 w-4" />
              Add Prospect
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'all' && <span className="ml-1.5 text-xs text-gray-400">{total}</span>}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title={searchQuery ? 'No matches found' : 'No prospects yet'}
                description={searchQuery ? 'Try a different search term.' : 'Add prospects manually or run the discovery agent.'}
                action={!searchQuery ? <button onClick={openAdd} className="btn-primary gap-2"><Plus className="h-4 w-4" /> Add Prospect</button> : undefined}
              />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Prospect</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Industry</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Tech Stack</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                      {p.title && <div className="text-xs text-gray-400">{p.title}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{p.company}</div>
                      {p.companySize && <div className="text-xs text-gray-400">{p.companySize} employees</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.industry || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.techStack.slice(0, 3).map(t => (
                          <span key={t} className="inline-flex px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{t}</span>
                        ))}
                        {p.techStack.length > 3 && (
                          <span className="text-xs text-gray-400">+{p.techStack.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Prospect' : 'Add Prospect'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="CEO, CTO..." className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input type="text" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="SaaS, FinTech..." className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                  <input type="number" value={form.companySize} onChange={e => setForm({ ...form, companySize: e.target.value })} placeholder="50" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label>
                <input type="text" value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} placeholder="React, Node.js, AWS (comma-separated)" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input type="url" value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any relevant notes..." className="input-field resize-none" />
              </div>
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
    </>
  );
}
