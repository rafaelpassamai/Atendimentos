'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useCatalogs() {
  return useQuery({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const [departments, products, categories, companies, contacts, staff] = await Promise.all([
        api.get<Array<{ id: string; name: string }>>('/catalogs/departments'),
        api.get<Array<{ id: string; name: string }>>('/catalogs/products'),
        api.get<Array<{ id: string; name: string }>>('/catalogs/categories'),
        api.get<Array<{ id: string; name: string }>>('/catalogs/companies'),
        api.get<Array<{ id: string; name: string; email: string }>>('/catalogs/company-contacts'),
        api.get<Array<{ id: string; full_name: string | null; email: string }>>('/users/staff'),
      ]);

      return { departments, products, categories, companies, contacts, staff };
    },
  });
}
