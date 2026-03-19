import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/useChatStore';

class ChatSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected && this.token === token) return;
    
    this.token = token;
    
    // Using the same base URL as API
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.xn--kraftig-g1a.com';
    console.log('Connecting to socket at:', baseURL);
    
    this.socket = io(baseURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      secure: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Successfully connected to chat server. ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error detail:', error.message);
      console.error('Socket engine error:', (error as any).description);
    });

    this.socket.on('new_message', (data) => {
      console.log('New message received:', data);
      const { addMessage } = useChatStore.getState();
      addMessage(data.message);
    });

    this.socket.on('message_read', (data) => {
      console.log('Message read:', data);
      const { updateReadStatus } = useChatStore.getState();
      updateReadStatus(data.conversationId, data.userId, data.messageIds);
    });

    this.socket.on('error', (error) => {
      console.error('Socket internal error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server. Reason:', reason);
    });
  }

  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }
}

export const chatSocketManager = new ChatSocketManager();
