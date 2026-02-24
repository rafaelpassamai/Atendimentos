'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Option {
  label: string;
  value: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}: {
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      value={value ?? ''}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="">{placeholder ?? 'Select'}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
