'use client';

import { TicketListResponse } from '@helpdesk/shared';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCatalogs } from '@/hooks/use-catalogs';
import { useMe } from '@/hooks/use-me';
import { PRIORITIES, PRIORITY_LABEL } from '@/lib/constants';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type ScopeTab = 'queue' | 'my' | 'all';
type WorkTab = 'queue' | 'in_progress';

export default function TicketsPage() {
  const me = useMe();
  const catalogs = useCatalogs();
  const [scopeTab, setScopeTab] = useState<ScopeTab>('queue');
  const [workTab, setWorkTab] = useState<WorkTab>('queue');
  const [priority, setPriority] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  const canViewAll = me.data?.user_type === 'admin';
  const canCreate = me.data?.user_type === 'admin';

  useEffect(() => {
    if (me.data?.preferred_category_ids) {
      setPreferredCategories(me.data.preferred_category_ids);
    }
  }, [me.data?.preferred_category_ids]);

  const visibleCategories = useMemo(() => {
    const allCategories = catalogs.data?.categories ?? [];
    if (canViewAll || preferredCategories.length === 0) {
      return allCategories;
    }
    return allCategories.filter((category) => preferredCategories.includes(category.id));
  }, [catalogs.data?.categories, canViewAll, preferredCategories]);

  useEffect(() => {
    if (selectedCategoryTab === 'all') return;
    if (!visibleCategories.some((category) => category.id === selectedCategoryTab)) {
      setSelectedCategoryTab('all');
    }
  }, [selectedCategoryTab, visibleCategories]);

  const status = workTab === 'queue' ? 'open' : 'in_progress';
  const selectedCategoryId = selectedCategoryTab === 'all' ? '' : selectedCategoryTab;

  const queryKey = useMemo(
    () => ['tickets', scopeTab, workTab, selectedCategoryId, priority, departmentId, assignedToUserId, page],
    [scopeTab, workTab, selectedCategoryId, priority, departmentId, assignedToUserId, page],
  );

  const baseQueryParams = useMemo(
    () =>
      `tab=${scopeTab}&page=1&pageSize=1${priority ? `&priority=${priority}` : ''}${departmentId ? `&departmentId=${departmentId}` : ''}${assignedToUserId ? `&assignedToUserId=${assignedToUserId}` : ''}${selectedCategoryId ? `&categoryId=${selectedCategoryId}` : ''}`,
    [scopeTab, priority, departmentId, assignedToUserId, selectedCategoryId],
  );

  const countersQuery = useQuery({
    queryKey: ['tickets-counters', baseQueryParams],
    queryFn: async () => {
      const [queueCount, inProgressCount] = await Promise.all([
        api.get<TicketListResponse>(`/tickets?${baseQueryParams}&status=open`),
        api.get<TicketListResponse>(`/tickets?${baseQueryParams}&status=in_progress`),
      ]);

      return {
        queue: queueCount.total,
        in_progress: inProgressCount.total,
      };
    },
  });

  const ticketsQuery = useQuery({
    queryKey,
    queryFn: () =>
      api.get<TicketListResponse>(
        `/tickets?tab=${scopeTab}&status=${status}&page=${page}&pageSize=20${priority ? `&priority=${priority}` : ''}${departmentId ? `&departmentId=${departmentId}` : ''}${assignedToUserId ? `&assignedToUserId=${assignedToUserId}` : ''}${selectedCategoryId ? `&categoryId=${selectedCategoryId}` : ''}`,
      ),
  });

  const rows = ticketsQuery.data?.data ?? [];
  const queueCount = countersQuery.data?.queue ?? 0;
  const inProgressCount = countersQuery.data?.in_progress ?? 0;
  const inProgressState = inProgressCount >= 20 ? 'critical' : inProgressCount >= 10 ? 'warning' : 'normal';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Chamados</h2>
        {canCreate ? (
          <Button asChild>
            <Link href="/tickets/new">Novo chamado</Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Tabs value={scopeTab} onValueChange={(value) => setScopeTab(value as ScopeTab)}>
              <TabsList>
                <TabsTrigger value="queue">Fila</TabsTrigger>
                <TabsTrigger value="my">Meus chamados</TabsTrigger>
                {canViewAll ? <TabsTrigger value="all">Todos</TabsTrigger> : null}
              </TabsList>
            </Tabs>
            <Tabs value={workTab} onValueChange={(value) => setWorkTab(value as WorkTab)}>
              <TabsList>
                <TabsTrigger value="queue">Pendentes na fila</TabsTrigger>
                <TabsTrigger value="in_progress">Em atendimento</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-2">
              <Button
                size="sm"
                variant={selectedCategoryTab === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategoryTab('all')}
              >
                Todos os setores
              </Button>
              {visibleCategories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategoryTab === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategoryTab(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={priority}
              onValueChange={setPriority}
              placeholder="Prioridade"
              options={PRIORITIES.map((item) => ({ label: PRIORITY_LABEL[item], value: item }))}
            />
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              placeholder="Departamento"
              options={(catalogs.data?.departments ?? []).map((item) => ({ label: item.name, value: item.id }))}
            />
            <Select
              value={assignedToUserId}
              onValueChange={setAssignedToUserId}
              placeholder="Responsavel"
              options={(catalogs.data?.staff ?? []).map((item) => ({
                label: item.full_name ?? item.email,
                value: item.id,
              }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fila (pendentes)</p>
              <p className="mt-2 text-2xl font-semibold">{queueCount}</p>
            </div>
            <div
              className={cn(
                'rounded-lg border p-4',
                inProgressState === 'critical' && 'border-destructive/60 bg-destructive/10',
                inProgressState === 'warning' && 'border-warning/60 bg-warning/10',
                inProgressState === 'normal' && 'border-border bg-card',
              )}
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Em atendimento</p>
              <p className="mt-2 text-2xl font-semibold">{inProgressCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {inProgressState === 'critical'
                  ? 'Critico: volume alto em andamento.'
                  : inProgressState === 'warning'
                    ? 'Atencao: acima do volume normal.'
                    : 'Volume dentro do esperado.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-2">Titulo</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Prioridade</th>
                  <th className="p-2">Setor</th>
                  <th className="p-2">Responsavel</th>
                  <th className="p-2">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/70 transition-colors hover:bg-muted/35">
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
                    <td className="p-2">{ticket.category?.name ?? '-'}</td>
                    <td className="p-2">{ticket.assignee?.full_name ?? ticket.assignee?.email ?? '-'}</td>
                    <td className="p-2">{new Date(ticket.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Nenhum chamado encontrado.</p> : null}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={(ticketsQuery.data?.page ?? 1) * (ticketsQuery.data?.pageSize ?? 20) >= (ticketsQuery.data?.total ?? 0)}
              onClick={() => setPage((current) => current + 1)}
            >
              Proximo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
