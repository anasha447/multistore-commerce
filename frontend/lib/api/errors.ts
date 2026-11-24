// Typed error thrown by the API client for any non-2xx response. Carries the parsed
// backend error envelope (API.md §3) so callers can branch on status and surface
// per-field validation messages.
import type { ApiErrorBody } from '@/lib/types/common';

export interface ApiErrorInit {
  /** The error envelope's `error` title, e.g. "Conflict". */
  title?: string;
  fieldErrors?: Record<string, string>;
  path?: string;
  body?: ApiErrorBody;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly fieldErrors?: Record<string, string>;
  readonly path?: string;
  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, init: ApiErrorInit = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.title = init.title ?? '';
    this.fieldErrors = init.fieldErrors;
    this.path = init.path;
    this.body = init.body;
    // Restore prototype chain for instanceof after transpilation to ES2017.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** 400 — validation/bad input; read `fieldErrors`. */
  get isValidation(): boolean {
    return this.status === 400;
  }
  /** 401 — missing/expired token (the client already attempted one refresh). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  /** 403 — authenticated but wrong role. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
  /** 404 — not found (also returned for someone else's resource; ownership is masked). */
  get isNotFound(): boolean {
    return this.status === 404;
  }
  /** 409 — duplicate, out of stock at checkout, coupon already used, concurrent edit. */
  get isConflict(): boolean {
    return this.status === 409;
  }
  /** 503 — a downstream service is momentarily unavailable; show "try again". */
  get isUnavailable(): boolean {
    return this.status === 503;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
