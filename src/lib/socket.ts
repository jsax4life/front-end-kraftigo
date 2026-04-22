import { io, Socket } from "socket.io-client";
import { useChatStore } from "@/store/useChatStore";
import { isEngineIoSessionUnknownError } from "@/lib/engineIoErrors";
import {
  getOrderedEnginePaths,
  getSocketConnectionBaseUrl,
  getSocketIoTransports,
  logSocketIoRoutingOnce,
  persistWorkingEnginePath,
} from "@/lib/socketIoPath";
import { probeEngineIoPathWithFetch, probeSocketHandshake } from "@/lib/socketIoProbe";

class ChatSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private connectGeneration = 0;
  private chatSessionUnknownRetries = 0;

  private wireHandlers(s: Socket, authToken: string) {
    s.on("connect", () => {
      this.chatSessionUnknownRetries = 0;
      console.log("Connected to chat server");
    });
    s.on("connect_error", (err) => {
      if (s !== this.socket) return;
      if (!isEngineIoSessionUnknownError(err) || this.chatSessionUnknownRetries >= 6) return;
      this.chatSessionUnknownRetries += 1;
      if (process.env.NODE_ENV === "development") {
        console.info("[chat] Session ID unknown — retrying connect (sticky sessions recommended).");
      }
      setTimeout(() => {
        if (s !== this.socket) return;
        this.connect(authToken);
      }, 400 + Math.random() * 500);
    });
    s.on("new_message", (data) => {
      console.log("New message received:", data);
      const { addMessage } = useChatStore.getState();
      addMessage(data.message);
    });
    s.on("message_read", (data) => {
      console.log("Message read:", data);
      const { updateReadStatus } = useChatStore.getState();
      updateReadStatus(data.conversationId, data.userId, data.messageIds);
    });
    s.on("error", (error: unknown) => {
      console.error("Socket error:", error);
    });
    s.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });
  }

  connect(token: string) {
    if (this.socket?.connected && this.token === token) return;

    this.token = token;
    this.disconnect();
    const gen = this.connectGeneration;
    const base = getSocketConnectionBaseUrl();

    void (async () => {
      logSocketIoRoutingOnce("chat");
      const paths = getOrderedEnginePaths();
      const transports = getSocketIoTransports();
      for (const path of paths) {
        if (gen !== this.connectGeneration) return;

        const fetchOk = await probeEngineIoPathWithFetch(base, path, token);
        if (gen !== this.connectGeneration) return;

        const ok =
          fetchOk || (await probeSocketHandshake(base, "chat", path, token, transports));
        if (gen !== this.connectGeneration) return;

        if (ok) {
          persistWorkingEnginePath(path);
          if (gen !== this.connectGeneration) return;

          this.socket = io(`${base}/chat`, {
            path,
            auth: { token },
            transports,
            reconnection: true,
            reconnectionAttempts: 12,
            reconnectionDelay: 2000,
            timeout: 20000,
          });
          this.wireHandlers(this.socket, token);
          return;
        }
      }
      console.warn(
        "[chat] No Engine.IO path worked. Set NEXT_PUBLIC_SOCKET_IO_PATH (see socketIoPath.ts).",
      );
    })();
  }

  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("join_conversation", { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("leave_conversation", { conversationId });
    }
  }

  disconnect() {
    this.connectGeneration += 1;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
  }
}

export const chatSocketManager = new ChatSocketManager();
