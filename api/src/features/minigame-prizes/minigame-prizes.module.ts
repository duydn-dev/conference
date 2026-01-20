import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinigamePrizesService } from './minigame-prizes.service';
import { MinigamePrizesController } from './minigame-prizes.controller';
import { MinigamePrize } from './entities/minigame-prize.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MinigamePrize])],
  controllers: [MinigamePrizesController],
  providers: [MinigamePrizesService],
})
export class MinigamePrizesModule {}
