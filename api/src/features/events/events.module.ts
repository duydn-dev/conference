import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { EventParticipant } from '../event-participants/entities/event-participant.entity';
import { EventJobsModule } from '../event-jobs/event-jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ParticipantsModule } from '../participants/participants.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventParticipant]), 
    EventJobsModule, 
    NotificationsModule,
    ParticipantsModule,
    AuthModule, // Để có JwtModule
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
