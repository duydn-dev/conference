import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinigameResultsService } from './minigame-results.service';
import { MinigameResultsController } from './minigame-results.controller';
import { MinigameResult } from './entities/minigame-result.entity';
import { EventParticipantsModule } from '../event-participants/event-participants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MinigameResult]),
    forwardRef(() => EventParticipantsModule),
  ],
  controllers: [MinigameResultsController],
  providers: [MinigameResultsService],
  exports: [MinigameResultsService],
})
export class MinigameResultsModule {}
