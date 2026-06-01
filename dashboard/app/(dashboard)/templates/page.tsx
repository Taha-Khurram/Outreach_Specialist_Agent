'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  FileText, Plus, Edit2, Trash2, X, Loader2, Copy, Mail,
} from 'lucide-react';

interface TemplateStep {
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
}

interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  steps: TemplateStep[];
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'meeting_request', label: 'Meeting Request' },
  { value: 'case_study', label: 'Case Study' },
];

const emptyStep: TemplateStep = { stepNumber: 1, subject: '', body: '', delayDays: 3 };

export default function TemplatesPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cold_outreach');
  const [steps, setSteps] = useState<TemplateStep[]>([{ ...emptyStep }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setDescription('');
    setCategory('cold_outreach');
    setSteps([{ ...emptyStep }]);
    setShowModal(true);
  }

  function openEdit(t: Template) {
    setEditingId(t._id);
    setName(t.name);
    setDescription(t.description);
    setCategory(t.category);
    setSteps(t.steps.length > 0 ? t.steps : [{ ...emptyStep }]);
    setShowModal(true);
  }

  function addStep() {
    setSteps(prev => [...prev, { stepNumber: prev.length + 1, subject: '', body: '', delayDays: 3 }]);
  }

  function removeStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  function updateStep(index: number, field: keyof TemplateStep, value: string | number) {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  async function handleSave() {
    if (!name.trim() || steps.length === 0 || !steps[0].subject.trim()) {
      toast('error', 'Name and at least one step with a subject are required');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/templates/${editingId}` : '/api/templates';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category, steps }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save template');
      }
      setShowModal(false);
      fetchTemplates();
      toast('success', editingId ? 'Template updated' : 'Template created');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Delete Template', message: 'Delete this template? This cannot be undone.', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      fetchTemplates();
      toast('success', 'Template deleted');
    } catch (err: any) {
      toast('error', err.message);
    }
  }

  async function handleDuplicate(t: Template) {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${t.name} (Copy)`,
          description: t.description,
          category: t.category,
          steps: t.steps,
        }),
      });
      if (!res.ok) throw new Error('Failed to duplicate');
      fetchTemplates();
      toast('success', 'Template duplicated');
    } catch (err: any) {
      toast('error', err.message);
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Templates" />
        <div className="p-6 flex justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Templates" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{templates.length} templates</p>
          <button onClick={openCreate} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> New Template
          </button>
        </div>

        {templates.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No templates yet"
            description="Create your first email template to use in campaigns."
            action={<button onClick={openCreate} className="btn-primary gap-2"><Plus className="h-4 w-4" /> Create Template</button>}
          />
        ) : (
          <div className="grid gap-4">
            {templates.map(t => (
              <div key={t._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                      {t.isDefault && (
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Default</span>
                      )}
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                        {t.category.replace('_', ' ')}
                      </span>
                    </div>
                    {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{t.steps.length} steps</span>
                      <span>Used {t.usageCount}x</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => handleDuplicate(t)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" aria-label="Duplicate template">
                      <Copy className="h-4 w-4" />
                    </button>
                    {!t.isDefault && (
                      <>
                        <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" aria-label="Edit template">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(t._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" aria-label="Delete template">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expandable steps preview */}
                <button
                  onClick={() => setExpandedId(expandedId === t._id ? null : t._id)}
                  className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  {expandedId === t._id ? 'Hide steps' : 'Show steps'}
                </button>
                {expandedId === t._id && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {t.steps.map((step, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">Step {step.stepNumber}</span>
                          {step.delayDays > 0 && <span className="text-[10px] text-gray-400">+{step.delayDays} days</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-800">{step.subject}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 whitespace-pre-line">{step.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl mb-10">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Template' : 'New Template'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded" aria-label="Close modal">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Direct Value Prop"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of when to use this template"
                  className="input-field"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Email Steps</h3>
                  <button onClick={addStep} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Step
                  </button>
                </div>
                <div className="space-y-4">
                  {steps.map((step, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500">Step {i + 1}</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-gray-500">
                            Delay:
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={step.delayDays}
                              onChange={e => updateStep(i, 'delayDays', Number(e.target.value))}
                              className="w-14 px-2 py-1 border rounded text-xs"
                            />
                            days
                          </label>
                          {steps.length > 1 && (
                            <button onClick={() => removeStep(i)} className="p-1 text-red-400 hover:text-red-600" aria-label="Remove step">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={step.subject}
                        onChange={e => updateStep(i, 'subject', e.target.value)}
                        placeholder="Subject line (supports {{firstName}}, {{company}}, etc.)"
                        className="input-field mb-2"
                      />
                      <textarea
                        value={step.body}
                        onChange={e => updateStep(i, 'body', e.target.value)}
                        placeholder="Email body..."
                        rows={4}
                        className="input-field resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
