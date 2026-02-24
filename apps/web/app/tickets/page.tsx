'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TicketListResponse } from '@helpdesk/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCatalogs } from '@/hooks/use-catalogs';
import { useMe } from '@/hooks/use-me';
import { PRIORITIES, STATUSES } from '@/lib/constants';
import { api } from '@/lib/api-client';

type Tab = 'queue' | 'my' | 'all';

export default function TicketsPage() {
  const me = useMe();
  const catalogs = useCatalogs();
  const [tab, setTab] = useState<Tab>('queue');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [page, setPage] = useState(1);

  const canViewAll = me.data?.user_type === 'admin';

  const queryKey = useMemo(
    () => ['tickets', tab, status, priority, departmentId, assignedToUserId, page],
    [tab, status, priority, departmentId, assignedToUserId, page],
  );

  const ticketsQuery = useQuery({
    queryKey,
    queryFn: () =>
      api.get<TicketListResponse>(
        `/tickets?tab=${tab}&page=${page}&pageSize=20${status ? `&status=${status}` : ''}${priority ? `&priority=${priority}` : ''}${departmentId ? `&departmentId=${departmentId}` : ''}${assignedToUserId ? `&assignedToUserId=${assignedToUserId}` : ''}`,
      ),
  });

  const rows = ticketsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tickets</h2>
        <Button asChild>
          <Link href="/tickets/new">Create Ticket</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
            <TabsList>
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="my">My Tickets</TabsTrigger>
              {canViewAll ? <TabsTrigger value="all">All</TabsTrigger> : null}
            </TabsList>
          </Tabs>

          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={status}
              onValueChange={setStatus}
              placeholder="Status"
              options={STATUSES.map((item) => ({ label: item, value: item }))}
            />
            <Select
              value={priority}
              onValueChange={setPriority}
              placeholder="Priority"
              options={PRIORITIES.map((item) => ({ label: item, value: item }))}
            />
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              placeholder="Department"
              options={(catalogs.data?.departments ?? []).map((item) => ({ label: item.name, value: item.id }))}
            />
            <Select
              value={assignedToUserId}
              onValueChange={setAssignedToUserId}
              placeholder="Assigned to"
              options={(catalogs.data?.staff ?? []).map((item) => ({
                label: item.full_name ?? item.email,
                value: item.id,
              }))}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-2">Title</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Department</th>
                  <th className="p-2">Assignee</th>
                  <th className="p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/70">
                    <td className="p-2">
                      <Link className="font-medium underline" href={`/tickets/${ticket.id}`}>
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="p-2">
                      <Badge value={ticket.status} />
                    </td>
                    <td className="p-2">
                      <Badge value={ticket.priority} />
                    </td>
                    <td className="p-2">{ticket.department?.name ?? '-'}</td>
                    <td className="p-2">{ticket.assignee?.full_name ?? ticket.assignee?.email ?? '-'}</td>
                    <td className="p-2">{new Date(ticket.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="py-6 text-sm text-muted-foreground">No tickets found.</p> : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={(ticketsQuery.data?.page ?? 1) * (ticketsQuery.data?.pageSize ?? 20) >= (ticketsQuery.data?.total ?? 0)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
