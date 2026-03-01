import { TicketPriority, TicketStatus } from '@helpdesk/shared';

export const STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
export const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  waiting_customer: 'Aguardando cliente',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};
