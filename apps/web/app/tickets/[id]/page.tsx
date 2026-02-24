'use client';

import { TicketMessage, TicketWithRelations } from '@helpdesk/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCatalogs } from '@/hooks/use-catalogs';
import { PRIORITIES, STATUSES } from '@/lib/constants';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const messageSchema = z.object({
  content: z.string().min(1),
  is_internal: z.boolean(),
});

type MessageValues = z.infer<typeof messageSchema>;

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

  const detailQuery = useQuery({
    queryKey: ['ticket-detail', ticketId],
    queryFn: () => api.get<TicketDetailResponse>(`/tickets/${ticketId}`),
  });

  const messageForm = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
      is_internal: false,
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

  const addMessageMutation = useMutation({
    mutationFn: (values: MessageValues) => api.post(`/tickets/${ticketId}/messages`, values),
    onSuccess: () => {
      toast.success('Message added');
      messageForm.reset({ content: '', is_internal: false });
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
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {detail.messages.map((message) => (
              <div key={message.id} className="rounded-md border border-border p-3">
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {message.is_internal ? 'Internal note' : 'Message'} - {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <form
            className="space-y-3"
            onSubmit={messageForm.handleSubmit((values) => addMessageMutation.mutate(values))}
          >
            <Label>Add message / note</Label>
            <Textarea {...messageForm.register('content')} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...messageForm.register('is_internal')} />
              Internal note
            </label>
            <Button type="submit" disabled={addMessageMutation.isPending}>
              {addMessageMutation.isPending ? 'Sending...' : 'Add'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
