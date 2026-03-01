import { cn } from '@/lib/utils';
import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/constants';

const variantClass = {
  open: 'bg-warning/20 text-warning border border-warning/30',
  in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25',
  waiting_customer: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25',
  resolved: 'bg-success/20 text-success border border-success/30',
  closed: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/25',
  low: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/25',
  medium: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-800 dark:text-red-300 border border-red-500/30',
} as const;

export function Badge({ value, className }: { value: keyof typeof variantClass; className?: string }) {
  const label =
    value in STATUS_LABEL
      ? STATUS_LABEL[value as keyof typeof STATUS_LABEL]
      : PRIORITY_LABEL[value as keyof typeof PRIORITY_LABEL];

  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', variantClass[value], className)}>
      {label}
    </span>
  );
}
