import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Event } from '../events/entities/event.entity';
import { EventParticipant } from '../event-participants/entities/event-participant.entity';
import { OrganizerUnit } from '../organizer-units/entities/organizer-unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventParticipant, OrganizerUnit]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
