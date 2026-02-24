import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listStaff() {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('id,full_name,email,user_type,is_active,created_at')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }
}
