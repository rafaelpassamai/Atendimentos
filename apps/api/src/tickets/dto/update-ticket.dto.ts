import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { TicketPriority, TicketStatus } from '@helpdesk/shared';

const statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(statuses)
  status?: TicketStatus;

  @IsOptional()
  @IsIn(priorities)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  assigned_to_user_id?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;
}
