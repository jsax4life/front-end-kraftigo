import { io, Socket } from "socket.io-client";
import { getStoredAccessToken } from "@/lib/axios";
import { useChatStore } from "@/store/useChatStore";
import { parseNewMessageSocketPayload } from "@/lib/chatMessaging";
import { isEngineIoSessionUnknownError } from "@/lib/engineIoErrors";
import {
  getOrderedEnginePaths,
  getSocketConnectionBaseUrl,
  getSocketIoTransports,
  logSocketIoRoutingOnce,
  persistWorkingEnginePath,
} from "@/lib/socketIoPath";
import { probeEngineIoPathWithFetch, probeSocketHandshake } from "@/lib/socketIoProbe";

function asChatRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
}

/** Typing / presence payloads often nest ids under different keys. */
function conversationIdFromSocketPayload(data: unknown): string {
  const d = asChatRecord(data);
  const keys = [
    d.conversationId,
    d.conversation_id,
    d.roomId,
    d.room_id,
    d.channelId,
    d.channel_id,
    d.chatId,
    d.chat_id,
  ];
  for (const v of keys) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const nested = d.payload ?? d.data ?? d.body;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const inner = conversationIdFromSocketPayload(nested);
    if (inner) return inner;
  }
  return "";
}

class ChatSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private connectGeneration = 0;
  private chatSessionUnknownRetries = 0;
  /** Conversation rooms from the inbox list — stay joined while on `/user/chat` or `/tasker/chat` so previews and badges update. */
  private inboxConversationIds = new Set<string>();
  /** Rooms opened in the overlay before the list refetches; removed on `leaveConversation`. */
  private eagerOpenConversationIds = new Set<string>();
  /** Rooms we believe the server has us subscribed to (cleared on each `connect`). */
  private serverJoinedConversationIds = new Set<string>();
  /** Helps coerce `new_message` payloads that omit `conversationId` on the nested message. */
  private parseHintConversationId: string | null = null;

  /** Replace inbox-driven subscriptions (e.g. all threads from `GET /api/conversations`). Pass `[]` when leaving the chat page. */
  syncConversationSubscriptions(conversationIds: string[]) {
    const next = new Set(
      conversationIds.map((x) => String(x).trim()).filter((x) => x.length > 0),
    );
    this.inboxConversationIds = next;
    this.applyConversationRoomSubscriptions();
  }

  private desiredConversationIds(): Set<string> {
    return new Set([...this.inboxConversationIds, ...this.eagerOpenConversationIds]);
  }

  private applyConversationRoomSubscriptions() {
    if (!this.socket?.connected) return;
    const desired = this.desiredConversationIds();
    for (const id of this.serverJoinedConversationIds) {
      if (!desired.has(id)) {
        this.socket.emit("leave_conversation", { conversationId: id });
        this.serverJoinedConversationIds.delete(id);
      }
    }
    for (const id of desired) {
      if (!this.serverJoinedConversationIds.has(id)) {
        this.socket.emit("join_conversation", { conversationId: id });
        this.serverJoinedConversationIds.add(id);
      }
    }
  }

  private resolveHandshakeToken(proposedFromCaller: string): string {
    const fromAxios = getStoredAccessToken()?.trim() ?? "";
    const proposed = proposedFromCaller.trim();
    return fromAxios || proposed || (this.token?.trim() ?? "");
  }

  private wireHandlers(s: Socket) {
    s.on("connect", () => {
      this.chatSessionUnknownRetries = 0;
      this.token = this.resolveHandshakeToken(this.token ?? "");
      this.serverJoinedConversationIds.clear();
      console.log("Connected to chat server");
      this.applyConversationRoomSubscriptions();
    });
    s.on("connect_error", (err) => {
      if (process.env.NODE_ENV === "development") {
        const msg = err && typeof err === "object" && "message" in err ? String((err as Error).message) : String(err);
        console.warn("[chat] connect_error", msg, err);
      }
      if (s !== this.socket) return;
      if (!isEngineIoSessionUnknownError(err) || this.chatSessionUnknownRetries >= 6) return;
      this.chatSessionUnknownRetries += 1;
      if (process.env.NODE_ENV === "development") {
        console.info("[chat] Session ID unknown — retrying connect (sticky sessions recommended).");
      }
      setTimeout(() => {
        if (s !== this.socket) return;
        const fresh = this.resolveHandshakeToken(this.token ?? "");
        if (fresh) this.connect(fresh);
      }, 400 + Math.random() * 500);
    });
    s.on("new_message", (data: unknown) => {
      let message = parseNewMessageSocketPayload(data);
      if (!message && this.parseHintConversationId) {
        message = parseNewMessageSocketPayload({
          conversationId: this.parseHintConversationId,
          message: data,
        });
      }
      if (!message) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[chat] new_message: unrecognized payload", data);
        }
        return;
      }
      useChatStore.getState().addMessage(message);
    });
    s.on("joined_conversation", (payload: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[chat] joined_conversation", payload);
      }
    });
    /** When the server creates a DM thread (e.g. after booking match); optional — ignored if never emitted. */
    s.on("conversation_created", () => {
      void useChatStore.getState().fetchConversations({ silent: true }).catch(() => {});
    });
    s.on("message_read", (data: unknown) => {
      const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      const conversationId = String(d.conversationId ?? d.conversation_id ?? "");
      const userId = String(d.userId ?? d.user_id ?? "");
      const rawIds = d.messageIds ?? d.message_ids;
      const messageIds = Array.isArray(rawIds)
        ? rawIds.filter((x): x is string => typeof x === "string")
        : [];
      if (!conversationId || !userId || messageIds.length === 0) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[chat] message_read: missing fields", data);
        }
        return;
      }
      const { updateReadStatus } = useChatStore.getState();
      updateReadStatus(conversationId, userId, messageIds);
    });

    const touchPeerFromPayload = (data: unknown) => {
      const cid = conversationIdFromSocketPayload(data);
      if (cid) useChatStore.getState().touchPeerActivityInRoom(cid);
    };
    const typingLikeEvents = ["typing", "typing_start", "user_typing", "conversation_typing", "peer_typing"];
    for (const ev of typingLikeEvents) {
      s.on(ev, touchPeerFromPayload);
    }
    s.on("error", (error: unknown) => {
      console.error("Socket error:", error);
    });
    s.on("disconnect", (reason: string) => {
      if (process.env.NODE_ENV === "development") {
        console.log("Disconnected from chat server", reason);
        if (reason === "io server disconnect") {
          console.info(
            "[chat] Server closed the socket. If JWT is valid for REST, ensure the access token used here matches axios after refresh (see applyRefreshedTokens). Backend: ChatGateway.handleConnection rejects missing/invalid token.",
          );
        }
      } else {
        console.log("Disconnected from chat server");
      }
    });
  }

  connect(token: string) {
    const proposed = typeof token === "string" ? token.trim() : "";
    const effective = this.resolveHandshakeToken(proposed);
    if (!effective) return;

    if (this.socket?.connected && this.token === effective) return;

    this.disconnect();
    this.token = effective;
    const gen = this.connectGeneration;
    const base = getSocketConnectionBaseUrl();

    void (async () => {
      logSocketIoRoutingOnce("chat");
      const paths = getOrderedEnginePaths();
      const transports = getSocketIoTransports();
      for (const path of paths) {
        if (gen !== this.connectGeneration) return;

        const fetchOk = await probeEngineIoPathWithFetch(base, path, effective);
        if (gen !== this.connectGeneration) return;

        const ok =
          fetchOk || (await probeSocketHandshake(base, "chat", path, effective, transports));
        if (gen !== this.connectGeneration) return;

        if (ok) {
          persistWorkingEnginePath(path);
          if (gen !== this.connectGeneration) return;

          this.socket = io(`${base}/chat`, {
            path,
            auth: (cb) => {
              const latest = this.resolveHandshakeToken(this.token ?? "");
              cb({ token: latest });
            },
            transports,
            reconnection: true,
            reconnectionAttempts: 12,
            reconnectionDelay: 2000,
            timeout: 20000,
          });
          this.wireHandlers(this.socket);
          this.applyConversationRoomSubscriptions();
          return;
        }
      }
      console.warn(
        "[chat] No Engine.IO path worked. Set NEXT_PUBLIC_SOCKET_IO_PATH (see socketIoPath.ts).",
      );
    })();
  }

  joinConversation(conversationId: string) {
    const id = conversationId?.trim();
    if (!id) return;
    this.parseHintConversationId = id;
    this.eagerOpenConversationIds.add(id);
    this.applyConversationRoomSubscriptions();
  }

  leaveConversation(conversationId: string) {
    const id = conversationId?.trim();
    if (!id) return;
    this.eagerOpenConversationIds.delete(id);
    if (this.parseHintConversationId === id) {
      const rest = [...this.eagerOpenConversationIds];
      this.parseHintConversationId = rest.length ? rest[rest.length - 1]! : null;
    }
    this.applyConversationRoomSubscriptions();
  }

  disconnect() {
    this.connectGeneration += 1;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    /** Do not clear `this.token` here — `connect()` needs it for the early-return guard; clearing caused every navigation to `/user/chat` to tear down a healthy socket and reuse a dead `sid` (polling 400 + WS closed). */
  }

  /**
   * After axios silent token refresh: reconnect /chat with the new JWT if we already had a session
   * (avoids waiting for Zustand `import().then` microtasks while `handleConnection` rejects the old token).
   */
  notifyAccessTokenRefreshed(accessToken: string) {
    const t = accessToken.trim();
    if (!t) return;
    if (this.socket === null && this.token === null) return;
    this.connect(t);
  }
}

export const chatSocketManager = new ChatSocketManager();
