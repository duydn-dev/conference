import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventParticipantsService } from './event-participants.service';
import { EventParticipantsController } from './event-participants.controller';
import { EventParticipant } from './entities/event-participant.entity';
import { ParticipantsModule } from '../participants/participants.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationReceiversModule } from '../notification-receivers/notification-receivers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventParticipant]),
    ParticipantsModule,
    forwardRef(() => EventsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => NotificationReceiversModule),
  ],
  controllers: [EventParticipantsController],
  providers: [EventParticipantsService],
  exports: [EventParticipantsService],
})
export class EventParticipantsModule {}
