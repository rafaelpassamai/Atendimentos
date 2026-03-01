'use client';

import { TicketMessage, TicketWithRelations } from '@helpdesk/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCatalogs } from '@/hooks/use-catalogs';
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL } from '@/lib/constants';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const taskSchema = z.object({
  content: z.string().min(1),
  due_date: z.string().optional(),
  observation: z.string().optional(),
});

type TaskValues = z.infer<typeof taskSchema>;

type TicketDetailResponse = {
  ticket: TicketWithRelations;
  messages: TicketMessage[];
  priority_rank: number;
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const queryClient = useQueryClient();
  const catalogs = useCatalogs();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const detailQuery = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => api.get<TicketDetailResponse>(`/tickets/${ticketId}`),
  });

  const taskForm = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      content: '',
      due_date: '',
      observation: '',
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['queue-preview'] });
  };

  const patchMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.patch(`/tickets/${ticketId}`, payload),
    onSuccess: () => {
      toast.success('Chamado atualizado');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addTaskMutation = useMutation({
    mutationFn: (values: TaskValues) =>
      api.post(`/tickets/${ticketId}/messages`, {
        content: values.content,
        due_date: values.due_date ? new Date(values.due_date).toISOString() : undefined,
        observation: values.observation || undefined,
      }),
    onSuccess: () => {
      toast.success('Tarefa adicionada');
      taskForm.reset({ content: '', due_date: '', observation: '' });
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTaskMutation = useMutation({
    mutationFn: (payload: { messageId: string; body: Record<string, unknown> }) =>
      api.patch(`/tickets/${ticketId}/messages/${payload.messageId}`, payload.body),
    onSuccess: () => {
      toast.success('Tarefa atualizada');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assignToMeMutation = useMutation({
    mutationFn: () => api.post(`/tickets/${ticketId}/assign-to-me`),
    onSuccess: () => {
      toast.success('Atribuido para voce');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => api.post(`/tickets/${ticketId}/close`),
    onSuccess: () => {
      toast.success('Chamado fechado');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const detail = detailQuery.data;

  const tasks = useMemo(() => detail?.messages ?? [], [detail]);

  if (!detail) {
    return <p className="text-sm text-muted-foreground">Carregando chamado...</p>;
  }

  const ticket = detail.ticket;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Detalhe do chamado</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie status, atribuicao e tarefas operacionais.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{ticket.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge value={ticket.status} />
            <Badge value={ticket.priority} />
          </div>
          <div className="grid gap-2 rounded-xl border border-border/80 bg-muted/35 p-4 text-sm text-muted-foreground md:grid-cols-2">
              <p>Departamento: {ticket.department?.name ?? '-'}</p>
            <p>Produto: {ticket.product?.name ?? '-'}</p>
            <p>Categoria: {ticket.category?.name ?? '-'}</p>
            <p>Empresa: {ticket.company?.name ?? '-'}</p>
            <p className="md:col-span-2">
              Contato: {ticket.requested_by_contact?.name ?? '-'} {ticket.requested_by_contact?.email ?? ''}
            </p>
          </div>
          {ticket.closed_at ? (
            <p className="text-sm font-medium text-success">Fechado em: {new Date(ticket.closed_at).toLocaleString()}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 rounded-xl border border-border/80 bg-muted/35 p-4 md:grid-cols-2">
            <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status || ticket.status}
                  onValueChange={setStatus}
                  options={STATUSES.map((item) => ({ label: STATUS_LABEL[item], value: item }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={priority || ticket.priority}
                  onValueChange={setPriority}
                  options={PRIORITIES.map((item) => ({ label: PRIORITY_LABEL[item], value: item }))}
                />
              </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => patchMutation.mutate({ status: status || ticket.status })}>Atualizar status</Button>
            <Button variant="secondary" onClick={() => patchMutation.mutate({ priority: priority || ticket.priority })}>
              Atualizar prioridade
            </Button>
            <Button variant="outline" onClick={() => assignToMeMutation.mutate()}>
              Atribuir para mim
            </Button>
            <Button variant="destructive" onClick={() => closeMutation.mutate()}>
              Fechar chamado
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Atribuir para usuario</Label>
            <Select
              onValueChange={(value) => patchMutation.mutate({ assigned_to_user_id: value })}
              options={(catalogs.data?.staff ?? []).map((item) => ({
                label: item.full_name ?? item.email,
                value: item.id,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {tasks.map((task) => {
              const observationValue = taskNotes[task.id] ?? task.observation ?? '';
              return (
                <div key={task.id} className="rounded-xl border border-border/80 bg-card/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${task.is_done ? 'bg-success' : 'bg-warning'}`} />
                      <p className={`text-sm font-medium ${task.is_done ? 'line-through text-muted-foreground' : ''}`}>{task.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={task.is_done ? 'secondary' : 'default'}
                      onClick={() => updateTaskMutation.mutate({ messageId: task.id, body: { is_done: !task.is_done } })}
                    >
                      {task.is_done ? 'Reabrir' : 'Marcar como feito'}
                    </Button>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Criado em: {new Date(task.created_at).toLocaleString()}
                    {task.due_date ? ` | Vencimento: ${new Date(task.due_date).toLocaleString()}` : ''}
                    {task.completed_at ? ` | Concluido em: ${new Date(task.completed_at).toLocaleString()}` : ''}
                  </p>

                  <div className="mt-3 space-y-2">
                    <Label>Observacao</Label>
                    <Textarea
                      value={observationValue}
                      onChange={(event) =>
                        setTaskNotes((current) => ({
                          ...current,
                          [task.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateTaskMutation.mutate({
                          messageId: task.id,
                          body: { observation: observationValue || '' },
                        })
                      }
                    >
                      Salvar observacao
                    </Button>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p> : null}
          </div>

          <form className="space-y-3 border-t border-border pt-4" onSubmit={taskForm.handleSubmit((values) => addTaskMutation.mutate(values))}>
            <Label>Nova tarefa</Label>
            <Textarea className="min-h-28" placeholder="Descreva a tarefa" {...taskForm.register('content')} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data limite (opcional)</Label>
                <Input type="datetime-local" {...taskForm.register('due_date')} />
              </div>
              <div className="space-y-2">
                <Label>Observacao (opcional)</Label>
                <Textarea {...taskForm.register('observation')} />
              </div>
            </div>
            <Button type="submit" disabled={addTaskMutation.isPending}>
              {addTaskMutation.isPending ? 'Adicionando...' : 'Adicionar tarefa'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
