'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';

interface DiscoverButtonProps {
  onComplete?: (result: { discovered: number; created: number; skipped: number }) => void;
  className?: string;
}

export function DiscoverButton({ onComplete, className }: DiscoverButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ discovered: number; created: number; skipped: number } | null>(null);
  const [error, setError] = useState('');

  async function handleDiscover() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/discover', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Discovery failed');
      setResult(data);
      onComplete?.(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleDiscover}
        disabled={loading}
        className="btn-primary gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? 'Discovering...' : 'Run Discovery'}
      </button>
      {result && (
        <p className="text-sm text-green-600 mt-2">
          Found {result.discovered} prospects — {result.created} new, {result.skipped} skipped.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
