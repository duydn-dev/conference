import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventParticipantsService } from './event-participants.service';
import { EventParticipantsController } from './event-participants.controller';
import { EventParticipant } from './entities/event-participant.entity';
import { ParticipantsModule } from '../participants/participants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventParticipant]),
    ParticipantsModule,
  ],
  controllers: [EventParticipantsController],
  providers: [EventParticipantsService],
})
export class EventParticipantsModule {}
