import { createRemoteJWKSet, jwtVerify } from 'jose';

export const PUBLIC_ROUTE_KEY = 'isPublicRoute';
export const ROLES_KEY = 'roles';

function getProjectBaseUrl() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  if (process.env.SUPABASE_PROJECT_REF) {
    return `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
  }
  throw new Error('SUPABASE_URL or SUPABASE_PROJECT_REF must be configured');
}

export function getJwksUrl(): string {
  if (process.env.SUPABASE_JWKS_URL) return process.env.SUPABASE_JWKS_URL;
  return `${getProjectBaseUrl()}/auth/v1/.well-known/jwks.json`;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(getJwksUrl()));
  }
  return jwks;
}

export async function verifySupabaseToken(token: string) {
  const issuer = `${getProjectBaseUrl()}/auth/v1`;
  return jwtVerify(token, getJwks(), { issuer });
}
