// WebSocketService.ts
/**
 * WebSocket Service
 * 
 * Handles WebSocket connections, subscriptions, and message handling with 
 * automatic reconnection and heartbeat to maintain connection stability.
 */

type MessageHandler = (event: MessageEvent) => void;
type EventHandler = (event: Event) => void;
type SubscriptionParams = Record<string, any>;

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private subscriptions: Map<string, SubscriptionParams> = new Map();
  private messageHandlers: MessageHandler[] = [];
  private openHandlers: EventHandler[] = [];
  private closeHandlers: EventHandler[] = [];
  private errorHandlers: EventHandler[] = [];
  private _reconnectAttempts: number = 0;

  constructor() {}

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = (event: Event) => {
      console.debug('WebSocket connection established');
      this.isConnecting = false;

      this.subscriptions.forEach((params, topic) => {
        this._sendSubscription(topic, params);
      });

      this._startHeartbeat();
      this.openHandlers.forEach(handler => handler(event));
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.debug('WebSocket connection closed');
      this._clearHeartbeat();
      this.closeHandlers.forEach(handler => handler(event));

      if (!event.wasClean) {
        this._scheduleReconnect();
      }
    };

    this.socket.onerror = (event: Event) => {
      console.error('WebSocket error:', event);
      this.errorHandlers.forEach(handler => handler(event));
    };

    this.socket.onmessage = (event: MessageEvent) => {
      if (event.data === 'pong') {
        return;
      }

      try {
        console.debug('WebSocket message received:', event.data);
        this.messageHandlers.forEach(handler => handler(event));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
  }

  disconnect(): void {
    if (this.socket) {
      this._clearHeartbeat();
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(topic: string, params: SubscriptionParams = {}): void {
    this.subscriptions.set(topic, params);

    if (this.isConnected()) {
      this._sendSubscription(topic, params);
    }
  }

  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);

    if (this.isConnected()) {
      this._send({
        action: 'unsubscribe',
        topic
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  onOpen(handler: EventHandler): void {
    this.openHandlers.push(handler);
  }

  onClose(handler: EventHandler): void {
    this.closeHandlers.push(handler);
  }

  onError(handler: EventHandler): void {
    this.errorHandlers.push(handler);
  }

  on(eventType: string, handler: (data: any) => void): void {
    this.onMessage((event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === eventType) {
          handler(data);
        }
      } catch (error) {
        console.error(`Error handling ${eventType} event:`, error);
      }
    });
  }

  off(eventType: string, handler: (data: any) => void): void {
    const handlers = this.subscriptions.get(eventType) as any[] || [];
    this.subscriptions.set(eventType, handlers.filter(h => h !== handler));
  }

  sendMessage(data: object | string): void {
    if (this.isConnected()) {
      this._send(data);
    } else {
      console.warn('Cannot send message, WebSocket not connected');
    }
  }

  private _sendSubscription(topic: string, params: SubscriptionParams): void {
    this._send({
      action: 'subscribe',
      topic,
      params
    });
  }

  private _send(data: object | string): void {
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket?.send(message);
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  private _startHeartbeat(): void {
    this._clearHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this._send({ action: 'ping' });
      }
    }, 30000);
  }

  private _clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(5000, 1000 * Math.pow(2, Math.min(3, this._reconnectAttempts)));

    console.debug(`Scheduling WebSocket reconnect in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      console.debug('Attempting to reconnect WebSocket');
      this._reconnectAttempts++;
      this.connect();
    }, delay);
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
