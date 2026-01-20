import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationReceiversService } from './notification-receivers.service';
import { NotificationReceiversController } from './notification-receivers.controller';
import { NotificationReceiver } from './entities/notification-receiver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationReceiver])],
  controllers: [NotificationReceiversController],
  providers: [NotificationReceiversService],
  exports: [NotificationReceiversService],
})
export class NotificationReceiversModule {}
