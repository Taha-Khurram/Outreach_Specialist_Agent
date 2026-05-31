'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChartData {
  date: string;
  sent: number;
  replies: number;
  meetings: number;
}

export function PerformanceChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    fetchChart();
  }, [range]);

  async function fetchChart() {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/chart?days=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-500">No data yet</p>
          <p className="text-xs text-gray-400">Charts will populate as emails are sent</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        {([7, 30, 90] as const).map(d => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              range === d ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {d} days
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area type="monotone" dataKey="sent" stackId="1" stroke="#8b5cf6" fill="#ede9fe" name="Sent" />
          <Area type="monotone" dataKey="replies" stackId="2" stroke="#10b981" fill="#d1fae5" name="Replies" />
          <Area type="monotone" dataKey="meetings" stackId="3" stroke="#f59e0b" fill="#fef3c7" name="Meetings" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
