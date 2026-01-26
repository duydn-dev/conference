import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinigamesService } from './minigames.service';
import { MinigamesController } from './minigames.controller';
import { Minigame } from './entities/minigame.entity';
import { MinigamePrizesModule } from '../minigame-prizes/minigame-prizes.module';
import { MinigameResultsModule } from '../minigame-results/minigame-results.module';
import { EventParticipantsModule } from '../event-participants/event-participants.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationReceiversModule } from '../notification-receivers/notification-receivers.module';
import { SocketModule } from '../../common/socket/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Minigame]),
    MinigamePrizesModule,
    MinigameResultsModule,
    forwardRef(() => EventParticipantsModule),
    NotificationsModule,
    NotificationReceiversModule,
    SocketModule,
  ],
  controllers: [MinigamesController],
  providers: [MinigamesService],
  exports: [MinigamesService],
})
export class MinigamesModule {}
