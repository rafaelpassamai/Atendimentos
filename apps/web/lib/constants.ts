import { TicketPriority, TicketStatus } from '@helpdesk/shared';

export const STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
export const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low'];
