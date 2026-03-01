'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCatalogs } from '@/hooks/use-catalogs';
import { useMe } from '@/hooks/use-me';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const me = useMe();
  const catalogs = useCatalogs();
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  useEffect(() => {
    if (me.data?.preferred_category_ids) {
      setPreferredCategories(me.data.preferred_category_ids);
    }
  }, [me.data?.preferred_category_ids]);

  const savePreferencesMutation = useMutation({
    mutationFn: (categoryIds: string[]) =>
      api.patch('/users/me/preferences', {
        preferred_category_ids: categoryIds,
      }),
    onSuccess: () => {
      toast.success('Setores visiveis atualizados');
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-counters'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function togglePreferredCategory(categoryId: string) {
    setPreferredCategories((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configuracoes pessoais de visibilidade de setores e escopo de chamados.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setores visiveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Selecione os setores que voce quer acompanhar. Isso controla as abas por setor e a visibilidade da lista.
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            {(catalogs.data?.categories ?? []).map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={preferredCategories.includes(category.id)}
                  onChange={() => togglePreferredCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
          <div>
            <Button
              onClick={() => savePreferencesMutation.mutate(preferredCategories)}
              disabled={savePreferencesMutation.isPending}
            >
              {savePreferencesMutation.isPending ? 'Salvando...' : 'Salvar setores visiveis'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
