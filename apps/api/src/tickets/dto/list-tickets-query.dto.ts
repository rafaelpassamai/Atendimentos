import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { TicketPriority, TicketStatus } from '@helpdesk/shared';

const statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export class ListTicketsQueryDto {
  @IsOptional()
  @IsIn(['queue', 'my', 'all'])
  tab?: 'queue' | 'my' | 'all' = 'queue';

  @IsOptional()
  @IsIn(statuses)
  status?: TicketStatus;

  @IsOptional()
  @IsIn(priorities)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  search?: string;
}
