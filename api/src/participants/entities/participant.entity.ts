import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { EventParticipant } from '../../event-participants/entities/event-participant.entity';
import { NotificationReceiver } from '../../notification-receivers/entities/notification-receiver.entity';
import { MinigameResult } from '../../minigame-results/entities/minigame-result.entity';

@Entity('participants')
export class Participant {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  identity_number: string;

  @Column({ type: 'varchar' })
  full_name: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', nullable: true })
  organization?: string | null;

  @Column({ type: 'varchar', nullable: true })
  position?: string | null;

  @Column({ type: 'boolean', default: false })
  is_receptionist: boolean; // Người đón tiếp

  @OneToMany(() => EventParticipant, (eventParticipant) => eventParticipant.participant)
  eventParticipants: EventParticipant[];

  @OneToMany(() => NotificationReceiver, (receiver) => receiver.participant)
  notificationReceivers: NotificationReceiver[];

  @OneToMany(() => MinigameResult, (result) => result.participant)
  minigameResults: MinigameResult[];

  @CreateDateColumn()
  created_at: Date;
}

