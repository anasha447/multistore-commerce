// Pluggable token storage. The HTTP client reads tokens here and writes refreshed
// ones back, so the actual storage mechanism (cookie, localStorage, server session)
// is a single swap made when the auth UI is built — no endpoint code changes.
//
// Default is in-memory (safe for SSR; resets on reload). Call configureTokenStore()
// from the auth layer later to plug in real persistence.

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenStore {
  getAccessToken(): string | null | Promise<string | null>;
  getRefreshToken(): string | null | Promise<string | null>;
  setTokens(tokens: Tokens): void | Promise<void>;
  clear(): void | Promise<void>;
}

export class InMemoryTokenStore implements TokenStore {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }
  getRefreshToken(): string | null {
    return this.refreshToken;
  }
  setTokens(tokens: Tokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }
  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

let activeStore: TokenStore = new InMemoryTokenStore();

export function configureTokenStore(store: TokenStore): void {
  activeStore = store;
}

export function getTokenStore(): TokenStore {
  return activeStore;
}
