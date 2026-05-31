'use client';

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md';
}

export default function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-400 border border-gray-200">
        —
      </span>
    );
  }

  const color =
    score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
    score >= 40 ? 'bg-orange-50 text-orange-700 border-orange-200' :
    'bg-gray-100 text-gray-600 border-gray-200';

  const sizeClasses = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-bold rounded-full border ${color} ${sizeClasses}`}>
      {score}
    </span>
  );
}
