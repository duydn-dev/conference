import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizerUnitsService } from './organizer-units.service';
import { OrganizerUnitsController } from './organizer-units.controller';
import { OrganizerUnit } from '../events/entities/organizer-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizerUnit])],
  controllers: [OrganizerUnitsController],
  providers: [OrganizerUnitsService],
})
export class OrganizerUnitsModule {}
