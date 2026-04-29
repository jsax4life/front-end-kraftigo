import { io, type Socket } from "socket.io-client";
import { isEngineIoSessionUnknownError } from "@/lib/engineIoErrors";
import {
  getOrderedEnginePaths,
  getSocketConnectionBaseUrl,
  getSocketIoTransports,
  logSocketIoRoutingOnce,
  persistWorkingEnginePath,
} from "@/lib/socketIoPath";
import { probeEngineIoPathWithFetch, probeSocketHandshake } from "@/lib/socketIoProbe";

let socket: Socket | null = null;
let activeToken: string | null = null;
/** Bumped on disconnect to cancel in-flight path probing. */
let connectGeneration = 0;

/** Survives soft disconnects so `connect_error` can call `connectDomainEventsSocket` again. */
let eventsReconnectCache: { token: string; onEvent: DomainEventHandler } | null = null;
let sessionUnknownRetries = 0;

export type DomainEventHandler = (msg: Record<string, unknown>) => void;

function attachEventSocketHandlers(s: Socket, onEvent: DomainEventHandler) {
  s.on("event", onEvent);
  s.on("connect", () => {
    sessionUnknownRetries = 0;
    if (process.env.NODE_ENV === "development") {
      console.info("[events] connected", s.io.opts.path, s.id);
    }
  });
  s.on("connect_error", (err) => {
    console.warn("[events] connect_error", s.io.opts.path, err?.message || err);
    if (
      !isEngineIoSessionUnknownError(err) ||
      !eventsReconnectCache ||
      sessionUnknownRetries >= 6 ||
      s !== socket
    ) {
      return;
    }
    sessionUnknownRetries += 1;
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[events] Session ID unknown — retrying connect. If this repeats, use sticky sessions (nginx ip_hash / cookie) or a single API worker for Socket.IO.",
      );
    }
    const { token, onEvent: handler } = eventsReconnectCache;
    setTimeout(() => {
      if (s !== socket || !eventsReconnectCache) return;
      connectDomainEventsSocket(token, handler);
    }, 400 + Math.random() * 500);
  });
  s.on("disconnect", (reason) => {
    if (process.env.NODE_ENV === "development") {
      console.info("[events] disconnected", reason);
    }
  });
}

async function runEventsSocketConnect(
  gen: number,
  accessToken: string,
  onEvent: DomainEventHandler,
): Promise<void> {
  logSocketIoRoutingOnce("events");
  const base = getSocketConnectionBaseUrl();
  const paths = getOrderedEnginePaths();
  const transports = getSocketIoTransports();

  for (const path of paths) {
    if (gen !== connectGeneration) return;

    const fetchOk = await probeEngineIoPathWithFetch(base, path, accessToken);
    if (gen !== connectGeneration) return;

    const ok =
      fetchOk ||
      (await probeSocketHandshake(base, "events", path, accessToken, transports));
    if (gen !== connectGeneration) return;

    if (ok) {
      persistWorkingEnginePath(path);
      if (gen !== connectGeneration) return;

      socket = io(`${base}/events`, {
        path,
        transports,
        auth: { token: accessToken },
        query: { token: accessToken },
        reconnection: true,
        reconnectionAttempts: 12,
        reconnectionDelay: 2000,
        timeout: 20000,
      });
      attachEventSocketHandlers(socket, onEvent);
      return;
    }
  }

  console.warn(
    "[events] No Engine.IO path worked. Set NEXT_PUBLIC_SOCKET_IO_PATH (e.g. /socket.io or /api/socket.io), or confirm Next rewrites proxy /socket.io to your API.",
  );
}

/**
 * Socket.IO client for domain events (namespace `/events`). Separate from chat (`/chat`).
 * Probes `/socket.io` and `/api/socket.io` (or `NEXT_PUBLIC_SOCKET_IO_PATH`) until one responds.
 * @see frontend-realtime-events.md
 */
export function connectDomainEventsSocket(accessToken: string, onEvent: DomainEventHandler): void {
  eventsReconnectCache = { token: accessToken, onEvent };

  if (socket?.connected && activeToken === accessToken) {
    socket.off("event");
    socket.on("event", onEvent);
    return;
  }

  disconnectDomainEventsSocket({ keepReconnectHint: true });
  activeToken = accessToken;
  const gen = connectGeneration;

  void runEventsSocketConnect(gen, accessToken, onEvent);
}

export function disconnectDomainEventsSocket(opts?: { keepReconnectHint?: boolean }): void {
  connectGeneration += 1;
  if (!opts?.keepReconnectHint) {
    eventsReconnectCache = null;
    activeToken = null;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function isDomainEventsSocketConnected(): boolean {
  return Boolean(socket?.connected);
}
