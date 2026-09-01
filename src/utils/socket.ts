import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private uid: string | null = null;
  
  public connect() {
    if (!this.socket) {
      this.socket = io({
        autoConnect: true,
        reconnection: true,
      });
      
      this.socket.on('connect', () => {
        console.log('[Matchmaking] Connected to Real-time Engine:', this.socket?.id);
      });
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public setUid(uid: string) {
    this.uid = uid;
  }

  public joinQueue(params: {
    uid: string;
    rating: number;
    rd?: number;
    pool: string;
    rated: boolean;
    recentColors?: ('w' | 'b')[];
  }) {
    if (!this.socket) this.connect();
    // Simulate ping calculation for matchmaking
    const pingStart = Date.now();
    this.socket?.emit('ping', () => {
      const ping = Date.now() - pingStart;
      this.socket?.emit('join_queue', {
        ...params,
        ping
      });
    });
  }

  public leaveQueue(uid: string) {
    this.socket?.emit('leave_queue', { uid });
  }

  public emitTabBlur(matchId: string, uid: string) {
    this.socket?.emit('tab_blur', { matchId, uid });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
