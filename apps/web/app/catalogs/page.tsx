'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCatalogs } from '@/hooks/use-catalogs';
import { useMe } from '@/hooks/use-me';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2),
});

function CatalogForm({ type }: { type: 'departments' | 'products' | 'categories' }) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => api.post(`/catalogs/${type}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      form.reset();
      toast.success('Catalog created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form className="flex gap-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <Input placeholder={`New ${type.slice(0, -1)}`} {...form.register('name')} />
      <Button type="submit" disabled={mutation.isPending}>
        Add
      </Button>
    </form>
  );
}

export default function CatalogsPage() {
  const me = useMe();
  const catalogs = useCatalogs();

  if (me.data?.user_type !== 'admin') {
    return <p className="text-sm text-muted-foreground">Only admins can manage catalogs.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Catalogs</h2>

      {[
        ['departments', catalogs.data?.departments ?? []],
        ['products', catalogs.data?.products ?? []],
        ['categories', catalogs.data?.categories ?? []],
      ].map(([type, items]) => (
        <Card key={String(type)}>
          <CardHeader>
            <CardTitle className="capitalize">{String(type)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CatalogForm type={type as 'departments' | 'products' | 'categories'} />
            <ul className="grid gap-1 text-sm">
              {(items as Array<{ id: string; name: string; is_active?: boolean }>).map((item) => (
                <li key={item.id} className="rounded border border-border px-2 py-1">
                  {item.name} {item.is_active === false ? '(inactive)' : ''}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
