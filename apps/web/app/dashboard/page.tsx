'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DashboardSummary, TicketWithRelations } from '@helpdesk/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';

export default function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<DashboardSummary>('/tickets/summary'),
  });

  const queueQuery = useQuery({
    queryKey: ['queue-preview'],
    queryFn: () => api.get<TicketWithRelations[]>('/tickets/queue-preview'),
  });

  const summary = summaryQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Painel</h2>
        <p className="mt-1 text-sm text-muted-foreground">Visao geral da operacao de suporte e saude da fila.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Abertos', summary?.open ?? 0],
          ['Em atendimento', summary?.in_progress ?? 0],
          ['Aguardando cliente', summary?.waiting_customer ?? 0],
          ['Resolvidos hoje', summary?.resolved_today ?? 0],
          ['Fechados hoje', summary?.closed_today ?? 0],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Previa da fila</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queueQuery.data?.map((ticket) => (
              <Link
                href={`/tickets/${ticket.id}`}
                key={ticket.id}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-card/70 p-3 transition-colors hover:bg-muted/70"
              >
                <div>
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-sm text-muted-foreground">{ticket.created_at}</p>
                </div>
                <Badge value={ticket.priority} />
              </Link>
            ))}
            {queueQuery.data?.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum chamado aberto.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
