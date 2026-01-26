import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationReceiver } from '../notification-receivers/entities/notification-receiver.entity';
import { SocketModule } from '../../common/socket/socket.module';
import { EventParticipantsModule } from '../event-participants/event-participants.module';
import { NotificationReceiversModule } from '../notification-receivers/notification-receivers.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationReceiver]),
    SocketModule,
    forwardRef(() => EventParticipantsModule),
    NotificationReceiversModule,
    AuthModule, // Để có JwtModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
