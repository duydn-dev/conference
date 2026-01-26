import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketService } from './socket.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Có thể config cụ thể hơn
    credentials: true,
  },
  // namespace: '/', // Bỏ namespace mặc định, không cần thiết
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly socketService: SocketService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('=== WebSocket Gateway initialized ===');
    this.logger.log(`Socket.IO server ready on port ${process.env.PORT || 3001}`);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`[CONNECTION] New client attempting to connect: ${client.id}`);
    this.logger.debug(`[CONNECTION] Handshake auth: ${JSON.stringify(client.handshake.auth)}`);
    this.logger.debug(`[CONNECTION] Handshake query: ${JSON.stringify(client.handshake.query)}`);
    
    try {
      // Lấy token từ handshake auth hoặc query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        this.logger.warn(`[CONNECTION] Client ${client.id} connected without token - disconnecting`);
        this.logger.debug(`[CONNECTION] Token value: ${token}, Type: ${typeof token}`);
        client.disconnect();
        return;
      }

      this.logger.debug(`[CONNECTION] Token found for client ${client.id}, verifying...`);
      this.logger.debug(`[CONNECTION] Token length: ${token.length}, Token preview: ${token.substring(0, 20)}...`);

      // Verify JWT token
      const secret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
      this.logger.debug(`[CONNECTION] Using JWT secret: ${secret ? 'Found' : 'Using default'}`);
      
      let payload;
      try {
        payload = this.jwtService.verify(token, { secret });
        this.logger.debug(`[CONNECTION] Token verified successfully. Payload: ${JSON.stringify(payload)}`);
      } catch (verifyError) {
        this.logger.error(`[CONNECTION] ❌ Token verification failed for client ${client.id}: ${verifyError.message}`);
        this.logger.error(`[CONNECTION] Verification error details: ${JSON.stringify(verifyError)}`);
        client.disconnect();
        return;
      }

      if (!payload || (!payload.id && !payload.sub)) {
        this.logger.warn(`[CONNECTION] Invalid token payload for client ${client.id} - disconnecting`);
        this.logger.debug(`[CONNECTION] Token payload: ${JSON.stringify(payload)}`);
        this.logger.debug(`[CONNECTION] Payload has id: ${!!payload?.id}, has sub: ${!!payload?.sub}`);
        client.disconnect();
        return;
      }

      // Lưu connection: participant_id -> socket_id
      // JWT payload có thể có id hoặc sub (sub là standard JWT field)
      const participantId = payload.id || payload.sub;
      if (!participantId) {
        this.logger.error(`[CONNECTION] Cannot extract participant ID from token payload`);
        this.logger.debug(`[CONNECTION] Payload: ${JSON.stringify(payload)}`);
        client.disconnect();
        return;
      }
      
      this.socketService.addConnection(participantId, client.id);
      (client as any).participantId = participantId;

      this.logger.log(`[CONNECTION] ✅ Client ${client.id} connected successfully for participant ${participantId}`);
      this.logger.debug(`[CONNECTION] Total connections for participant ${participantId}: ${this.socketService.getSocketIds(participantId).length}`);

      // Emit connection success
      client.emit('connected', { participantId, message: 'Connected successfully' });
      this.logger.debug(`[CONNECTION] Emitted 'connected' event to client ${client.id}`);
    } catch (error) {
      this.logger.error(`[CONNECTION] ❌ Error handling connection for client ${client.id}: ${error.message}`);
      this.logger.error(`[CONNECTION] Error stack: ${error.stack}`);
      this.logger.error(`[CONNECTION] Error details: ${JSON.stringify(error)}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const participantId = (client as any).participantId;
    if (participantId) {
      this.socketService.removeConnection(participantId, client.id);
      this.logger.log(`[DISCONNECT] Client ${client.id} disconnected for participant ${participantId}`);
      const remainingSockets = this.socketService.getSocketIds(participantId);
      this.logger.debug(`[DISCONNECT] Remaining connections for participant ${participantId}: ${remainingSockets.length}`);
    } else {
      this.logger.log(`[DISCONNECT] Client ${client.id} disconnected (no participant ID)`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }
}
