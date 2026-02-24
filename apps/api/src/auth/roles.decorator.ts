import { SetMetadata } from '@nestjs/common';
import { UserType } from '@helpdesk/shared';
import { ROLES_KEY } from './auth.constants';

export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
