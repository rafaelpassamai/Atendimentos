import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TicketPriority, TicketStatus } from '@helpdesk/shared';

const statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsOptional()
  @IsIn(statuses)
  status?: TicketStatus;

  @IsOptional()
  @IsIn(priorities)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsOptional()
  @IsUUID()
  requested_by_contact_id?: string;

  @IsOptional()
  @IsString()
  requested_by_email?: string;
}
