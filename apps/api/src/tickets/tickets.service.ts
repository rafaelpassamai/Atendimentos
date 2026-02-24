import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PRIORITY_RANK, TicketPriority, TicketWithRelations } from '@helpdesk/shared';
import { AuthUser } from '../common/types';
import { SupabaseService } from '../supabase/supabase.service';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

interface TicketListRpcRow {
  id: string;
  company_id: string | null;
  department_id: string | null;
  product_id: string | null;
  category_id: string | null;
  title: string;
  description: string | null;
  status: TicketWithRelations['status'];
  priority: TicketWithRelations['priority'];
  created_by_user_id: string | null;
  requested_by_contact_id: string | null;
  requested_by_email: string | null;
  assigned_to_user_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  company_name: string | null;
  department_name: string | null;
  product_name: string | null;
  category_name: string | null;
  assignee_email: string | null;
  assignee_full_name: string | null;
  creator_email: string | null;
  creator_full_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  total_count: number;
}

@Injectable()
export class TicketsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async list(query: ListTicketsQueryDto, user: AuthUser) {
    const { data, error } = await this.supabaseService.client.rpc('list_tickets', {
      p_user_id: user.id,
      p_user_type: user.user_type,
      p_tab: query.tab ?? 'queue',
      p_status: query.status ?? null,
      p_priority: query.priority ?? null,
      p_department_id: query.departmentId ?? null,
      p_product_id: query.productId ?? null,
      p_category_id: query.categoryId ?? null,
      p_assigned_to_user_id: query.assignedToUserId ?? null,
      p_search: query.search ?? null,
      p_page: query.page ?? 1,
      p_page_size: query.pageSize ?? 20,
    });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as TicketListRpcRow[];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    return {
      data: rows.map((row) => this.mapRpcRow(row)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async summary(user: AuthUser) {
    const { data, error } = await this.supabaseService.client.rpc('ticket_dashboard_summary', {
      p_user_id: user.id,
      p_user_type: user.user_type,
    });

    if (error) {
      throw error;
    }

    return data?.[0] ?? {
      open: 0,
      in_progress: 0,
      waiting_customer: 0,
      resolved_today: 0,
      closed_today: 0,
    };
  }

  async queuePreview(user: AuthUser) {
    const response = await this.list({ tab: 'queue', page: 1, pageSize: 10 }, user);
    return response.data;
  }

  async detail(id: string, user: AuthUser) {
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .select(
        `
        *,
        company:companies(id,name),
        department:departments(id,name),
        product:products(id,name),
        category:categories(id,name),
        assignee:profiles!tickets_assigned_to_user_id_fkey(id,full_name,email),
        creator:profiles!tickets_created_by_user_id_fkey(id,full_name,email),
        requested_by_contact:company_contacts(id,name,email)
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Ticket not found');
    }

    this.ensureTicketAccess(data, user);

    const { data: messages, error: messageError } = await this.supabaseService.client
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (messageError) {
      throw messageError;
    }

    const priority = data.priority as TicketPriority;

    return {
      ticket: data,
      messages,
      priority_rank: PRIORITY_RANK[priority],
    };
  }

  async create(body: CreateTicketDto, user: AuthUser) {
    const { data: created, error } = await this.supabaseService.client
      .from('tickets')
      .insert({
        title: body.title,
        description: body.description,
        status: body.status ?? 'open',
        priority: body.priority ?? 'medium',
        department_id: body.department_id ?? null,
        product_id: body.product_id ?? null,
        category_id: body.category_id ?? null,
        company_id: body.company_id ?? null,
        created_by_user_id: user.id,
        requested_by_contact_id: body.requested_by_contact_id ?? null,
        requested_by_email: body.requested_by_email ?? null,
      })
      .select('*')
      .single();

    if (error || !created) {
      throw error;
    }

    const { error: messageError } = await this.supabaseService.client
      .from('ticket_messages')
      .insert({
        ticket_id: created.id,
        author_user_id: user.id,
        is_internal: false,
        content: body.description,
      });

    if (messageError) {
      throw messageError;
    }

    return created;
  }

  async addMessage(id: string, body: AddTicketMessageDto, user: AuthUser) {
    const ticket = await this.getTicketById(id);
    this.ensureTicketAccess(ticket, user);

    const { data, error } = await this.supabaseService.client
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        author_user_id: user.id,
        is_internal: body.is_internal,
        content: body.content,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await this.touchTicket(id);
    return data;
  }

  async update(id: string, body: UpdateTicketDto, user: AuthUser) {
    const ticket = await this.getTicketById(id);
    this.ensureTicketAccess(ticket, user);

    const payload: Record<string, unknown> = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (body.status && body.status !== 'closed') {
      payload.closed_at = null;
    }

    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async assignToMe(id: string, user: AuthUser) {
    return this.update(
      id,
      {
        assigned_to_user_id: user.id,
      },
      user,
    );
  }

  async close(id: string, user: AuthUser) {
    const ticket = await this.getTicketById(id);
    this.ensureTicketAccess(ticket, user);

    const now = new Date().toISOString();
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .update({
        status: 'closed',
        closed_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  private async getTicketById(id: string) {
    const { data, error } = await this.supabaseService.client
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Ticket not found');
    }

    return data;
  }

  private ensureTicketAccess(ticket: TicketWithRelations, user: AuthUser) {
    if (user.user_type === 'admin') {
      return;
    }

    const canAccess =
      ticket.status === 'open' ||
      ticket.assigned_to_user_id === user.id ||
      ticket.created_by_user_id === user.id;

    if (!canAccess) {
      throw new ForbiddenException('No access to this ticket');
    }
  }

  private mapRpcRow(row: TicketListRpcRow): TicketWithRelations {
    return {
      id: row.id,
      company_id: row.company_id,
      department_id: row.department_id,
      product_id: row.product_id,
      category_id: row.category_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      created_by_user_id: row.created_by_user_id,
      requested_by_contact_id: row.requested_by_contact_id,
      requested_by_email: row.requested_by_email,
      assigned_to_user_id: row.assigned_to_user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      closed_at: row.closed_at,
      company: row.company_id ? { id: row.company_id, name: row.company_name ?? '' } : null,
      department: row.department_id ? { id: row.department_id, name: row.department_name ?? '' } : null,
      product: row.product_id ? { id: row.product_id, name: row.product_name ?? '' } : null,
      category: row.category_id ? { id: row.category_id, name: row.category_name ?? '' } : null,
      assignee: row.assigned_to_user_id
        ? {
            id: row.assigned_to_user_id,
            email: row.assignee_email ?? '',
            full_name: row.assignee_full_name,
          }
        : null,
      creator: row.created_by_user_id
        ? {
            id: row.created_by_user_id,
            email: row.creator_email ?? '',
            full_name: row.creator_full_name,
          }
        : null,
      requested_by_contact: row.requested_by_contact_id
        ? {
            id: row.requested_by_contact_id,
            name: row.contact_name ?? '',
            email: row.contact_email ?? '',
          }
        : null,
    };
  }

  private async touchTicket(id: string) {
    await this.supabaseService.client
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);
  }
}
