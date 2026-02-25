import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../common/types';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { UpdateTicketMessageDto } from './dto/update-ticket-message.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  list(@Query() query: ListTicketsQueryDto, @CurrentUser() user: AuthUser) {
    return this.ticketsService.list(query, user);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.ticketsService.summary(user);
  }

  @Get('queue-preview')
  queuePreview(@CurrentUser() user: AuthUser) {
    return this.ticketsService.queuePreview(user);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ticketsService.detail(id, user);
  }

  @Post()
  create(@Body() body: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.ticketsService.create(body, user);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() body: AddTicketMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.addMessage(id, body, user);
  }

  @Patch(':id/messages/:messageId')
  updateMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: UpdateTicketMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.updateMessage(id, messageId, body, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateTicketDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.update(id, body, user);
  }

  @Post(':id/assign-to-me')
  assignToMe(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ticketsService.assignToMe(id, user);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ticketsService.close(id, user);
  }
}
