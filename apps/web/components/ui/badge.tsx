import { cn } from '@/lib/utils';

const variantClass = {
  open: 'bg-warning/20 text-warning',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting_customer: 'bg-amber-100 text-amber-700',
  resolved: 'bg-success/20 text-success',
  closed: 'bg-slate-200 text-slate-700',
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
} as const;

export function Badge({ value, className }: { value: keyof typeof variantClass; className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', variantClass[value], className)}>
      {value.replace('_', ' ')}
    </span>
  );
}
