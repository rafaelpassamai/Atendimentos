import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type CatalogTable =
  | 'departments'
  | 'products'
  | 'categories'
  | 'companies'
  | 'company_contacts';

@Injectable()
export class CatalogsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async list(table: CatalogTable) {
    const orderBy = table === 'company_contacts' ? 'name' : 'name';
    const { data, error } = await this.supabaseService.client
      .from(table)
      .select('*')
      .order(orderBy, { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }

  async create(table: 'departments' | 'products' | 'categories', payload: { name: string; is_active?: boolean }) {
    const { data, error } = await this.supabaseService.client
      .from(table)
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(table: 'departments' | 'products' | 'categories', id: string, payload: { name?: string; is_active?: boolean }) {
    const { data, error } = await this.supabaseService.client
      .from(table)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Catalog item not found');
    }

    return data;
  }
}
