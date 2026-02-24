import { UserType } from '@helpdesk/shared';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  user_type: UserType;
  is_active: boolean;
}
