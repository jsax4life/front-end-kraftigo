import { io, type Socket } from "socket.io-client";

/**
 * Cheap path check: one HTTP GET, no Socket.IO session on the server.
 * Reduces "Session ID unknown" when the API runs behind multiple workers without sticky sessions
 * (a full `io()` probe + main `io()` used to create two sessions that could land on different nodes).
 */
export async function probeEngineIoPathWithFetch(
  baseHttpUrl: string,
  enginePath: string,
  accessToken: string,
  timeoutMs = 8000,
): Promise<boolean> {
  const root = baseHttpUrl.replace(/\/$/, "");
  const p = enginePath.startsWith("/") ? enginePath : `/${enginePath}`;
  const url = `${root}${p}/?EIO=4&transport=polling&t=${Date.now()}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return false;
    return text.includes('"sid"') || /^\d+:0\{/.test(text.trim()) || /^0\{/.test(text.trim());
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One-shot connect to see if an Engine.IO `path` works for this namespace URL.
 */
export function probeSocketHandshake(
  baseHttpUrl: string,
  /** URL segment after host, e.g. `events` → `io(\`${base}/events\`)` */
  urlSegment: "events" | "chat",
  enginePath: string,
  accessToken: string,
  transports: Array<"polling" | "websocket"> = ["polling", "websocket"],
  timeoutMs = 12000,
): Promise<boolean> {
  const url = `${baseHttpUrl.replace(/\/$/, "")}/${urlSegment}`;
  return new Promise((resolve) => {
    const s: Socket = io(url, {
      path: enginePath,
      auth: { token: accessToken },
      reconnection: false,
      timeout: timeoutMs,
      transports,
    });
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      s.removeAllListeners();
      s.disconnect();
      resolve(ok);
    };
    s.once("connect", () => finish(true));
    s.once("connect_error", () => finish(false));
    setTimeout(() => finish(false), timeoutMs + 500);
  });
}
