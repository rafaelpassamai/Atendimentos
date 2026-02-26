import { Injectable } from '@nestjs/common';
import { AuthUser } from '../common/types';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listStaff() {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('id,full_name,email,user_type,is_active,preferred_category_ids,created_at')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }

  async updatePreferences(user: AuthUser, body: UpdateUserPreferencesDto) {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .update({
        preferred_category_ids: body.preferred_category_ids ?? [],
      })
      .eq('id', user.id)
      .select('id,full_name,email,user_type,is_active,preferred_category_ids,created_at')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
