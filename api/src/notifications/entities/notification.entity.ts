import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { NotificationReceiver } from '../../notification-receivers/entities/notification-receiver.entity';

export enum NotificationType {
  REMINDER = 0,  // Nhắc nhở
  CHANGE = 1,    // Thay đổi thông tin
  CHECKIN = 2,   // Check-in
}

@Entity('notifications')
export class Notification {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.notifications)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'int' }) // 0: Nhắc nhở, 1: Thay đổi thông tin, 2: Check-in
  type: NotificationType;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_time?: Date | null;

  @OneToMany(() => NotificationReceiver, (receiver) => receiver.notification)
  receivers: NotificationReceiver[];

  @CreateDateColumn()
  created_at: Date;
}

