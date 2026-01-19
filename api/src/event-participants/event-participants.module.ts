import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventParticipantsService } from './event-participants.service';
import { EventParticipantsController } from './event-participants.controller';
import { EventParticipant } from '../events/entities/event-participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventParticipant])],
  controllers: [EventParticipantsController],
  providers: [EventParticipantsService],
})
export class EventParticipantsModule {}
