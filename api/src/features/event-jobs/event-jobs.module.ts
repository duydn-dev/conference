import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventJob } from './entities/event-job.entity';
import { EventJobsService } from './event-jobs.service';
import { Event } from '../events/entities/event.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationReceiversModule } from '../notification-receivers/notification-receivers.module';
import { EventParticipantsModule } from '../event-participants/event-participants.module';
import { SocketModule } from '../../common/socket/socket.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EventJob, Event]),
    forwardRef(() => NotificationsModule),
    forwardRef(() => NotificationReceiversModule),
    forwardRef(() => EventParticipantsModule),
    SocketModule,
  ],
  providers: [EventJobsService],
  exports: [EventJobsService],
})
export class EventJobsModule {}

