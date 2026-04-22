const STORAGE_KEY = "kraftigo-socket-engine-path";

/** HTTP API origin (no trailing slash). */
export function apiHttpBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "https://api.xn--kraftig-g1a.com").replace(
    /\/$/,
    "",
  );
}

/** `NEXT_PUBLIC_SOCKET_IO_DISABLE_BROWSER_PROXY`: `1`, `true`, or `yes` (case-insensitive). */
export function isSocketIoBrowserProxyDisabled(): boolean {
  const v = process.env.NEXT_PUBLIC_SOCKET_IO_DISABLE_BROWSER_PROXY?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Base URL for Socket.IO (Engine.IO) handshakes in the browser.
 * Defaults to same-origin so `next.config` rewrites can proxy to the API and avoid CORS.
 * Set `NEXT_PUBLIC_SOCKET_IO_DISABLE_BROWSER_PROXY=1` (or `true`) to use the API host directly
 * (Browser → nginx → NestJS; requires API CORS for your frontend origin).
 */
export function getSocketConnectionBaseUrl(): string {
  if (typeof window === "undefined") return apiHttpBase();
  if (isSocketIoBrowserProxyDisabled()) return apiHttpBase();
  return window.location.origin;
}

/**
 * Transports follow **where Engine.IO actually connects**, not “frontend vs API different origins”.
 * - **Same-origin rewrite** (Socket URL = browser origin ≠ API, e.g. Next rewrites): **`polling` only**
 *   — WebSocket upgrade through that hop to an external API is unreliable.
 * - **Direct to API** (`https://api…` as connection base, e.g. nginx in front of Nest): **`polling` + `websocket`**
 *   so Engine.IO can upgrade once polling has established the session.
 */
export function getSocketIoTransports(): Array<"polling" | "websocket"> {
  if (typeof window === "undefined") return ["polling", "websocket"];
  try {
    const connOrigin = new URL(getSocketConnectionBaseUrl()).origin;
    const browserOrigin = window.location.origin;
    const apiOrigin = new URL(apiHttpBase()).origin;
    const usingAppOriginAsSocketHost =
      connOrigin === browserOrigin && connOrigin !== apiOrigin;
    if (usingAppOriginAsSocketHost) return ["polling"];
  } catch {
    /* bad URL */
  }
  return ["polling", "websocket"];
}

let loggedRouting = false;

/** Once per tab (dev): explains why Engine.IO URLs look like localhost while traffic still hits the API. */
export function logSocketIoRoutingOnce(context: string): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;
  if (loggedRouting) return;
  loggedRouting = true;
  const upstream = apiHttpBase();
  const base = getSocketConnectionBaseUrl();
  const t = getSocketIoTransports();
  try {
    const sameOriginRewrite =
      new URL(base).origin === window.location.origin &&
      new URL(base).origin !== new URL(upstream).origin;
    if (sameOriginRewrite) {
      console.info(
        `[${context}] Socket.IO`,
        base,
        "(same-origin). Next rewrites /socket.io →",
        upstream,
        "| transports:",
        t.join(","),
        "(polling only: WS via app→external proxy is unreliable)",
      );
    } else {
      console.info(
        `[${context}] Socket.IO →`,
        base,
        "| transports:",
        t.join(","),
        "| ensure CORS allows",
        window.location.origin,
      );
    }
  } catch {
    console.info(`[${context}] Socket.IO →`, base, "| transports:", t.join(","));
  }
}

/**
 * If set, only this path is used (no probing). Must start with `/`, e.g. `/realtime/socket.io`.
 * @see https://socket.io/docs/v4/client-options/#path
 */
export function getExplicitSocketIoPath(): string | null {
  const p = process.env.NEXT_PUBLIC_SOCKET_IO_PATH?.trim();
  if (p && p.startsWith("/")) return p;
  return null;
}

export function getPersistedEnginePath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v && v.startsWith("/")) return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function persistWorkingEnginePath(path: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* ignore */
  }
}

/** Paths to try on `NEXT_PUBLIC_API_URL` until one handshakes (unless env forces a single path). */
export function getOrderedEnginePaths(): string[] {
  const explicit = getExplicitSocketIoPath();
  if (explicit) return [explicit];

  const remembered = getPersistedEnginePath();
  const defaults = ["/socket.io", "/api/socket.io"];
  if (remembered) {
    return [remembered, ...defaults.filter((d) => d !== remembered)];
  }
  return defaults;
}
