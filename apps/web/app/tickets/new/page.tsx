'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCatalogs } from '@/hooks/use-catalogs';
import { useMe } from '@/hooks/use-me';
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL } from '@/lib/constants';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const statusEnum = z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']);
const priorityEnum = z.enum(['urgent', 'high', 'medium', 'low']);

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  status: statusEnum.default('open'),
  priority: priorityEnum.default('medium'),
  department_id: z.string().optional(),
  product_id: z.string().optional(),
  category_id: z.string().optional(),
  company_id: z.string().optional(),
  requested_by_contact_id: z.string().optional(),
  requested_by_email: z.string().email().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function NewTicketPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const catalogs = useCatalogs();
  const me = useMe();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      requested_by_email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return api.post<{ id: string }>('/tickets', {
        ...values,
        requested_by_email: values.requested_by_email || null,
      });
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Chamado criado');
      router.push(`/tickets/${ticket.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Falha ao criar chamado');
    },
  });

  if (me.data && me.data.user_type !== 'admin') {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Somente administradores podem abrir novos chamados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Novo chamado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra um chamado interno com contexto completo e solicitante correto.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informacoes do chamado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="space-y-2">
              <Label>Titulo</Label>
              <Input placeholder="Resumo curto da solicitacao" {...form.register('title')} />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea className="min-h-32" placeholder="Descreva contexto, impacto e resultado esperado." {...form.register('description')} />
            </div>

            <div className="grid gap-4 rounded-xl border border-border/80 bg-muted/35 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as FormValues['status'])}
                  options={STATUSES.map((item) => ({ label: STATUS_LABEL[item], value: item }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={form.watch('priority')}
                  onValueChange={(value) => form.setValue('priority', value as FormValues['priority'])}
                  options={PRIORITIES.map((item) => ({ label: PRIORITY_LABEL[item], value: item }))}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-border/80 bg-muted/35 p-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={form.watch('department_id')}
                  onValueChange={(value) => form.setValue('department_id', value || undefined)}
                  options={(catalogs.data?.departments ?? []).map((item) => ({ label: item.name, value: item.id }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={form.watch('product_id')}
                  onValueChange={(value) => form.setValue('product_id', value || undefined)}
                  options={(catalogs.data?.products ?? []).map((item) => ({ label: item.name, value: item.id }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.watch('category_id')}
                  onValueChange={(value) => form.setValue('category_id', value || undefined)}
                  options={(catalogs.data?.categories ?? []).map((item) => ({ label: item.name, value: item.id }))}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-border/80 bg-muted/35 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select
                  value={form.watch('company_id')}
                  onValueChange={(value) => form.setValue('company_id', value || undefined)}
                  options={(catalogs.data?.companies ?? []).map((item) => ({ label: item.name, value: item.id }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Solicitado por contato</Label>
                <Select
                  value={form.watch('requested_by_contact_id')}
                  onValueChange={(value) => form.setValue('requested_by_contact_id', value || undefined)}
                  options={(catalogs.data?.contacts ?? []).map((item) => ({
                    label: `${item.name} (${item.email})`,
                    value: item.id,
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email do solicitante (opcional)</Label>
              <Input placeholder="cliente@empresa.com" {...form.register('requested_by_email')} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Criando...' : 'Criar chamado'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
