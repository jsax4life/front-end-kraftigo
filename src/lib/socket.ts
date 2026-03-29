import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/useChatStore';

class ChatSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected && this.token === token) return;
    
    this.token = token;
    
    // According to the backend team, we must connect to the '/chat' namespace explicitly.
    // Standard socket.io-client 'io' call treats the path suffix as a namespace.
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.xn--kraftig-g1a.com';
    
    this.socket = io(`${baseURL}/chat`, {
      auth: { token },
      transports: ['websocket'],
      // Standard path is /socket.io, which matches the gateway
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
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
      console.error('Socket error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
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
