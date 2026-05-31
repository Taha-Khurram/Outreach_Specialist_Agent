'use client';

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md';
}

export default function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-400">
        —
      </span>
    );
  }

  const color =
    score >= 80 ? 'bg-green-100 text-green-700' :
    score >= 60 ? 'bg-amber-100 text-amber-700' :
    score >= 40 ? 'bg-orange-100 text-orange-700' :
    'bg-gray-100 text-gray-600';

  const sizeClasses = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-bold rounded-full ${color} ${sizeClasses}`}>
      {score}
    </span>
  );
}
