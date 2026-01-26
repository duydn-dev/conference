import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);
  // Map participant_id -> Set of socket_ids
  private connections = new Map<string, Set<string>>();

  /**
   * Thêm connection cho participant
   */
  addConnection(participantId: string, socketId: string): void {
    if (!this.connections.has(participantId)) {
      this.connections.set(participantId, new Set());
      this.logger.log(`[SOCKET_SERVICE] First connection for participant ${participantId}`);
    }
    this.connections.get(participantId)!.add(socketId);
    const totalConnections = this.connections.get(participantId)!.size;
    this.logger.log(`[SOCKET_SERVICE] ✅ Added connection: participant ${participantId} -> socket ${socketId} (total: ${totalConnections})`);
    this.logger.debug(`[SOCKET_SERVICE] Total participants online: ${this.connections.size}`);
  }

  /**
   * Xóa connection
   */
  removeConnection(participantId: string, socketId: string): void {
    const sockets = this.connections.get(participantId);
    if (sockets) {
      sockets.delete(socketId);
      const remaining = sockets.size;
      if (sockets.size === 0) {
        this.connections.delete(participantId);
        this.logger.log(`[SOCKET_SERVICE] Removed last connection for participant ${participantId}`);
      } else {
        this.logger.log(`[SOCKET_SERVICE] Removed connection: participant ${participantId} -> socket ${socketId} (remaining: ${remaining})`);
      }
      this.logger.debug(`[SOCKET_SERVICE] Total participants online: ${this.connections.size}`);
    } else {
      this.logger.warn(`[SOCKET_SERVICE] Attempted to remove connection for unknown participant ${participantId}`);
    }
  }

  /**
   * Lấy tất cả socket IDs của participant
   */
  getSocketIds(participantId: string): string[] {
    const sockets = this.connections.get(participantId);
    const socketIds = sockets ? Array.from(sockets) : [];
    this.logger.debug(`[SOCKET_SERVICE] getSocketIds for participant ${participantId}: found ${socketIds.length} socket(s)`);
    return socketIds;
  }

  /**
   * Kiểm tra participant có đang online không
   */
  isOnline(participantId: string): boolean {
    return this.connections.has(participantId) && this.connections.get(participantId)!.size > 0;
  }

  /**
   * Lấy số lượng connections hiện tại
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Lấy tất cả participant IDs đang online
   */
  getOnlineParticipants(): string[] {
    return Array.from(this.connections.keys());
  }
}
