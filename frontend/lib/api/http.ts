// The single transport for every API call. Responsibilities:
//  - prefix the gateway base URL, encode the query string, JSON-encode the body
//  - attach `Authorization: Bearer <accessToken>` for authed requests
//  - on a 401, transparently refresh once (single-flight) and retry
//  - normalize any non-2xx into a typed ApiError; return parsed JSON otherwise
//
// Endpoint modules call `http.get/post/put/del`; nothing else builds requests directly.
import { API_BASE_URL, STORE_HEADERS } from './config';
import { ApiError } from './errors';
import { toQueryString, type QueryParams } from './query';
import { getTokenStore } from './tokenStore';
import type { ApiErrorBody } from '@/lib/types/common';
import type { TokenResponse } from '@/lib/types/auth';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  body?: unknown;
  query?: QueryParams;
  /** Send the access token and enable 401-refresh-retry. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

type BodylessOptions = Omit<RequestOptions, 'body'>;

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const store = getTokenStore();
  const refreshToken = await store.getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { ...STORE_HEADERS, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          await store.clear();
          return null;
        }
        const tokens = (await res.json()) as TokenResponse;
        await store.setTokens({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        return tokens.accessToken;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function toApiError(res: Response, url: string): Promise<ApiError> {
  let body: ApiErrorBody | undefined;
  let message = `Request failed with status ${res.status}`;
  try {
    const text = await res.text();
    if (text) {
      body = JSON.parse(text) as ApiErrorBody;
      if (body?.message) message = body.message;
    }
  } catch {
    // Non-JSON error body (e.g. a gateway/proxy error page) — keep the generic message.
  }
  return new ApiError(res.status, message, {
    title: body?.error,
    fieldErrors: body?.fieldErrors,
    path: body?.path ?? url,
    body,
  });
}

async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, auth = true, signal, headers: extraHeaders } = options;
  const url = API_BASE_URL + path + (query ? toQueryString(query) : '');
  const store = getTokenStore();

  const send = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { ...STORE_HEADERS, Accept: 'application/json', ...extraHeaders };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      // Allow the optional access_token cookie strategy; CORS allows credentials.
      credentials: 'include',
    });
  };

  const token = auth ? await store.getAccessToken() : null;
  let res = await send(token);

  // On 401 for an authed call, attempt a single transparent refresh + retry.
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await send(refreshed);
  }

  if (!res.ok) throw await toApiError(res, url);
  return parseBody<T>(res);
}

export const http = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T> =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T> =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T> =>
    request<T>('PATCH', path, { ...options, body }),
  del: <T>(path: string, options?: RequestOptions): Promise<T> => request<T>('DELETE', path, options),
};
