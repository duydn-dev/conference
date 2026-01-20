import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventJob } from './entities/event-job.entity';
import { EventJobsService } from './event-jobs.service';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EventJob, Event]),
  ],
  providers: [EventJobsService],
  exports: [EventJobsService],
})
export class EventJobsModule {}

