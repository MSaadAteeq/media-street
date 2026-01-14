import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const wsUrl = API_BASE_URL.replace(/^https?:\/\//, '').split('/')[0];
    const protocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${wsUrl}`;

    try {
      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
        }
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Notification events
  onNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  offNotification(callback?: (notification: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('notification', callback);
      } else {
        this.socket.off('notification');
      }
    }
  }

  onNotificationCount(callback: (data: { count: number }) => void) {
    if (this.socket) {
      this.socket.on('notification:count', callback);
    }
  }

  offNotificationCount(callback?: (data: { count: number }) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('notification:count', callback);
      } else {
        this.socket.off('notification:count');
      }
    }
  }

  // Message events
  onMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('message', callback);
    }
  }

  offMessage(callback?: (message: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('message', callback);
      } else {
        this.socket.off('message');
      }
    }
  }

  // Request notifications
  requestNotifications() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('notifications:fetch');
    }
  }

  // Request unread count
  requestUnreadCount() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('notifications:count');
    }
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('notification:read', { notificationId });
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('notifications:read-all');
    }
  }

  // Join partnership room for messages
  joinPartnership(partnershipId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('partnership:join', { partnershipId });
    }
  }

  // Leave partnership room
  leavePartnership(partnershipId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('partnership:leave', { partnershipId });
    }
  }

  // Send message
  sendMessage(data: { partnershipId: string; messageText: string; recipientId: string }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message:send', data);
    }
  }

  // Request messages for partnership
  requestMessages(partnershipId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('messages:fetch', { partnershipId });
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;
