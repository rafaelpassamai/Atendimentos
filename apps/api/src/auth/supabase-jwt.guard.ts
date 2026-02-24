import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';
import { PUBLIC_ROUTE_KEY, verifySupabaseToken } from './auth.constants';

function getCookieToken(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (request.method === 'OPTIONS') {
      return true;
    }

    const rawAuth =
      request.headers.authorization ?? request.headers.Authorization;
    const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;

    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;
    const cookieToken = getCookieToken(request.headers.cookie, 'sb-access-token');
    const token = bearerToken ?? cookieToken;

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = (await verifySupabaseToken(token)).payload;
      const userId = payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token subject');
      }

      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('id,full_name,email,user_type,is_active,created_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw new UnauthorizedException(`Profile query failed: ${error.message}`);
      }

      if (!data) {
        throw new UnauthorizedException(`Profile not found for user ${userId}`);
      }

      if (!data.is_active) {
        throw new UnauthorizedException(`Profile inactive for user ${userId}`);
      }

      request.user = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        user_type: data.user_type,
        is_active: data.is_active,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
