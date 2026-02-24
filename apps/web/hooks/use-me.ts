'use client';

import { useQuery } from '@tanstack/react-query';
import { Profile } from '@helpdesk/shared';
import { api } from '@/lib/api-client';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Profile>('/users/me'),
  });
}
