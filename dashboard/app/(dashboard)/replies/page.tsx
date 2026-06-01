'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import {
  MessageSquare, CheckCircle, XCircle, Clock, RefreshCw,
  Loader2, Send, X, Zap, Ban,
} from 'lucide-react';

interface ReplyInteraction {
  _id: string;
  prospectId: string;
  classification: string;
  confidence: number;
  subject: string;
  body: string;
  autoReplied: boolean;
  createdAt: string;
  prospect: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    title: string;
  } | null;
}

const classificationStyles: Record<string, { bg: string; text: string; label: string }> = {
  POSITIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Positive' },
  NEUTRAL: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Neutral' },
  NEGATIVE: { bg: 'bg-red-50', text: 'text-red-700', label: 'Negative' },
  UNSUBSCRIBE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unsubscribe' },
};

const filters = ['all', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNSUBSCRIBE'];

export default function RepliesPage() {
  const { toast } = useToast();
  const [replies, setReplies] = useState<ReplyInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [filter, setFilter] = useState('all');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [checkResult, setCheckResult] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyInteraction | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRepliesCount, setTotalRepliesCount] = useState(0);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '25', offset: ((page - 1) * 25).toString() });
      if (filter !== 'all') params.set('classification', filter);
      const res = await fetch(`/api/replies?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReplies(data.replies);
      setCounts(data.counts || {});
      setTotalRepliesCount(data.total || data.replies.length);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchReplies(); }, [fetchReplies]);

  async function handleCheck() {
    setChecking(true);
    setCheckResult('');
    try {
      const res = await fetch('/api/replies/check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      const { checked, classified, autoReplied } = data;
      setCheckResult(
        `Checked ${checked} messages: ${classified.positive} positive, ${classified.neutral} neutral, ${classified.negative} negative, ${classified.unsubscribe} unsubscribe. Auto-replied: ${autoReplied}.`
      );
      fetchReplies();
    } catch (err: any) {
      setCheckResult(`Error: ${err.message}`);
    } finally {
      setChecking(false);
    }
  }

  function openReply(reply: ReplyInteraction) {
    setReplyingTo(reply);
    setReplyText('');
    setShowReplyModal(true);
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;
    setSending(true);
    try {
      const res = await fetch(`/api/replies/${replyingTo._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
      setShowReplyModal(false);
      fetchReplies();
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setSending(false);
    }
  }

  const totalReplies = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <Header title="Replies" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.POSITIVE || 0}</p>
              <p className="text-xs text-gray-500">Positive</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.NEUTRAL || 0}</p>
              <p className="text-xs text-gray-500">Neutral</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.NEGATIVE || 0}</p>
              <p className="text-xs text-gray-500">Negative</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Ban className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{counts.UNSUBSCRIBE || 0}</p>
              <p className="text-xs text-gray-500">Unsubscribed</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'All' : classificationStyles[f]?.label || f}
                {f === 'all' && <span className="ml-1.5 text-xs text-gray-400">{totalReplies}</span>}
              </button>
            ))}
          </div>
          <button onClick={handleCheck} disabled={checking} className="btn-primary gap-2 disabled:opacity-50">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {checking ? 'Checking...' : 'Check Now'}
          </button>
        </div>

        {checkResult && (
          <div className={`rounded-lg border p-3 text-sm ${checkResult.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {checkResult}
          </div>
        )}

        {/* Replies List */}
        <div className="space-y-3">
          {loading ? (
            <div className="card flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : replies.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<MessageSquare className="h-8 w-8" />}
                title="No replies yet"
                description="Click 'Check Now' to poll your inbox, or replies will appear here once prospects respond."
              />
            </div>
          ) : (
            replies.map(reply => {
              const style = classificationStyles[reply.classification] || classificationStyles.NEUTRAL;
              return (
                <div key={reply._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {reply.prospect ? `${reply.prospect.firstName} ${reply.prospect.lastName}` : 'Unknown'}
                        </span>
                        {reply.prospect?.company && (
                          <span className="text-xs text-gray-400">at {reply.prospect.company}</span>
                        )}
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        {reply.autoReplied && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            <Zap className="h-3 w-3" /> Auto-replied
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{reply.subject || '(no subject)'}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reply.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          Confidence: {Math.round((reply.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openReply(reply)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Reply
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Pagination */}
        {totalRepliesCount > 25 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, totalRepliesCount)} of {totalRepliesCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 25 >= totalRepliesCount}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && replyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReplyModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reply to {replyingTo.prospect?.firstName || 'Prospect'}</h2>
              <button onClick={() => setShowReplyModal(false)} aria-label="Close modal" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Their reply:</p>
                <p className="text-sm text-gray-700">{replyingTo.body}</p>
              </div>
              <form onSubmit={handleSendReply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your response</label>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={5}
                    placeholder="Type your reply..."
                    className="input-field resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowReplyModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={sending || !replyText.trim()} className="btn-primary gap-2 disabled:opacity-50">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
