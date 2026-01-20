import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';
import { Participant } from '../../participants/entities/participant.entity';

@Entity('notification_receivers')
export class NotificationReceiver {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  notification_id: string;

  @ManyToOne(() => Notification, (notification) => notification.receivers)
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ type: 'uuid' })
  participant_id: string;

  @ManyToOne(() => Participant, (participant) => participant.notificationReceivers)
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ type: 'timestamp', nullable: true })
  sent_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date | null;
}

