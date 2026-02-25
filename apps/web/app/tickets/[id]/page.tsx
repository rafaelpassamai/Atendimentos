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
import { PRIORITIES, STATUSES } from '@/lib/constants';
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
      toast.success('Ticket updated');
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
      toast.success('Task added');
      taskForm.reset({ content: '', due_date: '', observation: '' });
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTaskMutation = useMutation({
    mutationFn: (payload: { messageId: string; body: Record<string, unknown> }) =>
      api.patch(`/tickets/${ticketId}/messages/${payload.messageId}`, payload.body),
    onSuccess: () => {
      toast.success('Task updated');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assignToMeMutation = useMutation({
    mutationFn: () => api.post(`/tickets/${ticketId}/assign-to-me`),
    onSuccess: () => {
      toast.success('Assigned to you');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => api.post(`/tickets/${ticketId}/close`),
    onSuccess: () => {
      toast.success('Ticket closed');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const detail = detailQuery.data;

  const tasks = useMemo(() => detail?.messages ?? [], [detail]);

  if (!detail) {
    return <p>Loading...</p>;
  }

  const ticket = detail.ticket;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{ticket.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge value={ticket.status} />
            <Badge value={ticket.priority} />
          </div>
          <p className="text-sm text-muted-foreground">Department: {ticket.department?.name ?? '-'}</p>
          <p className="text-sm text-muted-foreground">Product: {ticket.product?.name ?? '-'}</p>
          <p className="text-sm text-muted-foreground">Category: {ticket.category?.name ?? '-'}</p>
          <p className="text-sm text-muted-foreground">Company: {ticket.company?.name ?? '-'}</p>
          <p className="text-sm text-muted-foreground">
            Contact: {ticket.requested_by_contact?.name ?? '-'} {ticket.requested_by_contact?.email ?? ''}
          </p>
          {ticket.closed_at ? (
            <p className="text-sm font-medium text-success">Closed at: {new Date(ticket.closed_at).toLocaleString()}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status || ticket.status}
              onValueChange={setStatus}
              options={STATUSES.map((item) => ({ label: item, value: item }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority || ticket.priority}
              onValueChange={setPriority}
              options={PRIORITIES.map((item) => ({ label: item, value: item }))}
            />
          </div>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button onClick={() => patchMutation.mutate({ status: status || ticket.status })}>Update Status</Button>
            <Button variant="secondary" onClick={() => patchMutation.mutate({ priority: priority || ticket.priority })}>
              Update Priority
            </Button>
            <Button variant="outline" onClick={() => assignToMeMutation.mutate()}>
              Assign to me
            </Button>
            <Button variant="destructive" onClick={() => closeMutation.mutate()}>
              Close ticket
            </Button>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Assign to user</Label>
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
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {tasks.map((task) => {
              const observationValue = taskNotes[task.id] ?? task.observation ?? '';
              return (
                <div key={task.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm ${task.is_done ? 'line-through text-muted-foreground' : ''}`}>{task.content}</p>
                    <Button
                      size="sm"
                      variant={task.is_done ? 'secondary' : 'default'}
                      onClick={() => updateTaskMutation.mutate({ messageId: task.id, body: { is_done: !task.is_done } })}
                    >
                      {task.is_done ? 'Reopen' : 'Mark done'}
                    </Button>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(task.created_at).toLocaleString()}
                    {task.due_date ? ` | Due: ${new Date(task.due_date).toLocaleString()}` : ''}
                    {task.completed_at ? ` | Completed: ${new Date(task.completed_at).toLocaleString()}` : ''}
                  </p>

                  <div className="mt-3 space-y-2">
                    <Label>Observation</Label>
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
                      Save observation
                    </Button>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet.</p> : null}
          </div>

          <form className="space-y-3 border-t border-border pt-4" onSubmit={taskForm.handleSubmit((values) => addTaskMutation.mutate(values))}>
            <Label>New task</Label>
            <Textarea placeholder="Describe the task" {...taskForm.register('content')} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Due date (optional)</Label>
                <Input type="datetime-local" {...taskForm.register('due_date')} />
              </div>
              <div className="space-y-2">
                <Label>Observation (optional)</Label>
                <Textarea {...taskForm.register('observation')} />
              </div>
            </div>
            <Button type="submit" disabled={addTaskMutation.isPending}>
              {addTaskMutation.isPending ? 'Adding...' : 'Add task'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
