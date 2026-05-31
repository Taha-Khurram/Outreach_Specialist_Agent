import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    new: { label: 'New', variant: 'info' },
    contacted: { label: 'Contacted', variant: 'warning' },
    replied: { label: 'Replied', variant: 'success' },
    meeting: { label: 'Meeting', variant: 'success' },
    closed: { label: 'Closed', variant: 'success' },
    unsubscribed: { label: 'Unsubscribed', variant: 'danger' },
    draft: { label: 'Draft', variant: 'default' },
    active: { label: 'Active', variant: 'success' },
    paused: { label: 'Paused', variant: 'warning' },
    completed: { label: 'Completed', variant: 'info' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' as BadgeVariant };
  return <Badge variant={variant}>{label}</Badge>;
}
