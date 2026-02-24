export const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const ACCESS_TOKEN_STORAGE_KEY = 'sb-access-token';

export function setAccessTokenCookie(token: string) {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${token}; path=/; max-age=28800; samesite=lax`;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  }
}

export function clearAccessTokenCookie() {
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}

export function getAccessTokenCookie() {
  const cookieToken =
    typeof document !== 'undefined'
      ? (() => {
          const cookie = document.cookie
            .split('; ')
            .find((entry) => entry.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
          if (!cookie) return null;
          return decodeURIComponent(cookie.slice(`${ACCESS_TOKEN_COOKIE}=`.length));
        })()
      : null;

  if (cookieToken) return cookieToken;

  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  return null;
}
