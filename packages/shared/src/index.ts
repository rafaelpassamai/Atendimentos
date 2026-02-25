export type UserType = 'admin' | 'agent';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export const PRIORITY_RANK: Record<TicketPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  user_type: UserType;
  is_active: boolean;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CompanyContact {
  id: string;
  company_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  company_id: string | null;
  department_id: string | null;
  product_id: string | null;
  category_id: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_by_user_id: string | null;
  requested_by_contact_id: string | null;
  requested_by_email: string | null;
  assigned_to_user_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_contact_id: string | null;
  is_internal: boolean;
  content: string;
  is_done: boolean;
  completed_at: string | null;
  due_date: string | null;
  observation: string | null;
  created_at: string;
}

export interface TicketWithRelations extends Ticket {
  company?: Pick<Company, 'id' | 'name'> | null;
  department?: Pick<CatalogItem, 'id' | 'name'> | null;
  product?: Pick<CatalogItem, 'id' | 'name'> | null;
  category?: Pick<CatalogItem, 'id' | 'name'> | null;
  assignee?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
  creator?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
  requested_by_contact?: Pick<CompanyContact, 'id' | 'name' | 'email'> | null;
}

export interface TicketListResponse {
  data: TicketWithRelations[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DashboardSummary {
  open: number;
  in_progress: number;
  waiting_customer: number;
  resolved_today: number;
  closed_today: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  departmentId?: string;
  productId?: string;
  categoryId?: string;
  assignedToUserId?: string;
  tab?: 'queue' | 'my' | 'all';
  page?: number;
  pageSize?: number;
}
