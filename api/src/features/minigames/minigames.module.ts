import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinigamesService } from './minigames.service';
import { MinigamesController } from './minigames.controller';
import { Minigame } from './entities/minigame.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Minigame])],
  controllers: [MinigamesController],
  providers: [MinigamesService],
})
export class MinigamesModule {}
