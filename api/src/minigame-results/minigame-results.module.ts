import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinigameResultsService } from './minigame-results.service';
import { MinigameResultsController } from './minigame-results.controller';
import { MinigameResult } from '../events/entities/minigame-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MinigameResult])],
  controllers: [MinigameResultsController],
  providers: [MinigameResultsService],
})
export class MinigameResultsModule {}
