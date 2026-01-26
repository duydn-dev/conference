import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module'; // Import AuthModule để sử dụng JwtModule đã được export

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Import AuthModule để có JwtModule (đã được export từ AuthModule)
  ],
  providers: [SocketGateway, SocketService],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
