import { IsBoolean, IsString, MinLength } from 'class-validator';

export class AddTicketMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsBoolean()
  is_internal!: boolean;
}
