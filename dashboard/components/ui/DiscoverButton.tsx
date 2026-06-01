'use client';

import { useState } from 'react';
import {
  Loader2, Search, X, UserPlus, Building2, MapPin, Briefcase,
  ChevronLeft, ChevronRight, Check, Globe, Sparkles, Database,
} from 'lucide-react';

interface DiscoverButtonProps {
  onComplete?: (result: { discovered: number; created: number; skipped: number }) => void;
  className?: string;
}

interface SearchResult {
  apolloId: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  companySize: number | null;
  linkedinUrl: string;
}

interface SearchFilters {
  titles: string;
  industries: string;
  location: string;
  companySize: string;
  keywords: string;
  companyName: string;
  domains: string;
}

const defaultFilters: SearchFilters = {
  titles: 'CEO, CTO, Founder, VP Engineering',
  industries: 'SaaS, Technology',
  location: 'United States',
  companySize: '10-200',
  keywords: '',
  companyName: '',
  domains: '',
};

type DiscoverSource = 'auto' | 'apollo' | 'ai';

export function DiscoverButton({ onComplete, className }: DiscoverButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; totalPages: number } | null>(null);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);
  const [source, setSource] = useState<DiscoverSource>('auto');
  const [activeSource, setActiveSource] = useState<string>('');

  function openModal() {
    setShowModal(true);
    setResults([]);
    setSelected(new Set());
    setError('');
    setImportResult(null);
    setPagination(null);
    setPage(1);
    setActiveSource('');
  }

  function buildTargeting() {
    const t: Record<string, any> = {};
    if (filters.titles.trim()) t.titles = filters.titles.split(',').map(s => s.trim()).filter(Boolean);
    if (filters.industries.trim()) t.industries = filters.industries.split(',').map(s => s.trim()).filter(Boolean);
    if (filters.location.trim()) t.location = filters.location.trim();
    if (filters.companySize.trim()) t.companySize = filters.companySize.trim() + ' employees';
    if (filters.keywords.trim()) t.keywords = filters.keywords.trim();
    if (filters.companyName.trim()) t.companyName = filters.companyName.trim();
    if (filters.domains.trim()) t.domains = filters.domains.split(',').map(s => s.trim()).filter(Boolean);
    return t;
  }

  async function handleSearch(searchPage = 1) {
    setSearching(true);
    setError('');
    setImportResult(null);
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'search',
          source,
          targeting: buildTargeting(),
          page: searchPage,
          perPage: 25,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.suggestion === 'ai') {
          setSource('ai');
          throw new Error(data.error + ' Switching to AI mode.');
        }
        throw new Error(data.error || 'Search failed');
      }
      setResults(data.results || []);
      setPagination(data.pagination || null);
      setPage(searchPage);
      setSelected(new Set());
      setActiveSource(data.source || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleImport() {
    if (selected.size === 0) return;
    setImporting(true);
    setError('');
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'import',
          source,
          targeting: buildTargeting(),
          selectedIds: Array.from(selected),
          page,
          perPage: 25,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResult({ created: data.created, skipped: data.skipped });
      onComplete?.(data);
      setResults(prev => prev.filter(r => !selected.has(r.apolloId)));
      setSelected(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const withEmail = results.filter(r => r.email);
    setSelected(new Set(withEmail.map(r => r.apolloId)));
  }

  return (
    <div className={className}>
      <button onClick={openModal} className="btn-primary gap-2">
        <Search className="h-4 w-4" /> Discover Prospects
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-4xl mb-8">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Prospect Discovery</h2>
                <p className="text-sm text-gray-500 mt-0.5">Find and import leads using AI or Apollo</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Source Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Source:</span>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setSource('auto')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      source === 'auto' ? 'bg-brand-50 text-brand-700 border-r border-gray-200' : 'text-gray-600 hover:bg-gray-50 border-r border-gray-200'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setSource('ai')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      source === 'ai' ? 'bg-purple-50 text-purple-700 border-r border-gray-200' : 'text-gray-600 hover:bg-gray-50 border-r border-gray-200'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" /> AI Discovery
                  </button>
                  <button
                    onClick={() => setSource('apollo')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      source === 'apollo' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Database className="h-3 w-3" /> Apollo
                  </button>
                </div>
                {activeSource && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    activeSource === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    Using {activeSource === 'ai' ? 'AI' : 'Apollo'}
                  </span>
                )}
              </div>

              {/* Search Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <Briefcase className="h-3.5 w-3.5" /> Job Titles
                  </label>
                  <input
                    type="text"
                    value={filters.titles}
                    onChange={e => setFilters({ ...filters, titles: e.target.value })}
                    placeholder="CEO, CTO, Founder"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <Building2 className="h-3.5 w-3.5" /> Industries
                  </label>
                  <input
                    type="text"
                    value={filters.industries}
                    onChange={e => setFilters({ ...filters, industries: e.target.value })}
                    placeholder="SaaS, FinTech, HealthTech"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={e => setFilters({ ...filters, location: e.target.value })}
                    placeholder="United States"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <UserPlus className="h-3.5 w-3.5" /> Company Size
                  </label>
                  <input
                    type="text"
                    value={filters.companySize}
                    onChange={e => setFilters({ ...filters, companySize: e.target.value })}
                    placeholder="10-200"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <Search className="h-3.5 w-3.5" /> Keywords
                  </label>
                  <input
                    type="text"
                    value={filters.keywords}
                    onChange={e => setFilters({ ...filters, keywords: e.target.value })}
                    placeholder="machine learning, react"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
                    <Globe className="h-3.5 w-3.5" /> Company Domains
                  </label>
                  <input
                    type="text"
                    value={filters.domains}
                    onChange={e => setFilters({ ...filters, domains: e.target.value })}
                    placeholder="stripe.com, notion.so"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSearch(1)}
                  disabled={searching}
                  className="btn-primary gap-2 disabled:opacity-50"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : (source === 'ai' ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />)}
                  {searching ? 'Searching...' : source === 'ai' ? 'Discover with AI' : source === 'apollo' ? 'Search Apollo' : 'Search'}
                </button>
                {pagination && (
                  <span className="text-sm text-gray-500">
                    {pagination.total.toLocaleString()} results found
                  </span>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}
              {importResult && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                  Imported {importResult.created} new prospects ({importResult.skipped} skipped — already exist or missing email).
                </div>
              )}

              {/* Results Table */}
              {results.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                    <div className="flex items-center gap-3">
                      <button onClick={selectAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                        Select all with email
                      </button>
                      {selected.size > 0 && (
                        <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-700">
                          Clear ({selected.size})
                        </button>
                      )}
                    </div>
                    {selected.size > 0 && (
                      <button
                        onClick={handleImport}
                        disabled={importing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                        Import {selected.size} Selected
                      </button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white border-b">
                        <tr>
                          <th className="w-10 px-3 py-2"></th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Name</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Title</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Company</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {results.map(r => (
                          <tr key={r.apolloId} className={`hover:bg-gray-50 ${selected.has(r.apolloId) ? 'bg-brand-50/40' : ''}`}>
                            <td className="px-3 py-2">
                              {r.email ? (
                                <button
                                  onClick={() => toggleSelect(r.apolloId)}
                                  className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                    selected.has(r.apolloId)
                                      ? 'bg-brand-600 border-brand-600 text-white'
                                      : 'border-gray-300 hover:border-brand-400'
                                  }`}
                                >
                                  {selected.has(r.apolloId) && <Check className="h-3 w-3" />}
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400">No email</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-medium text-gray-900">{r.firstName} {r.lastName}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">{r.title || '—'}</td>
                            <td className="px-3 py-2">
                              <div className="text-gray-900">{r.company || '—'}</div>
                              {r.industry && <div className="text-[11px] text-gray-400">{r.industry}</div>}
                            </td>
                            <td className="px-3 py-2 text-gray-600 text-xs">{r.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
                      <span className="text-xs text-gray-500">
                        Page {page} of {pagination.totalPages}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSearch(page - 1)}
                          disabled={page <= 1 || searching}
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSearch(page + 1)}
                          disabled={page >= pagination.totalPages || searching}
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state after search */}
              {!searching && results.length === 0 && pagination && (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No results found. Try broader search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
