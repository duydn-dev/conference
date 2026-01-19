import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventContentsService } from './event-contents.service';
import { EventContentsController } from './event-contents.controller';
import { EventContent } from '../events/entities/event-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventContent])],
  controllers: [EventContentsController],
  providers: [EventContentsService],
})
export class EventContentsModule {}
