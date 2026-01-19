import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { OrganizerUnit } from './organizer-unit.entity';
import { EventContent } from './event-content.entity';
import { EventDocument } from './event-document.entity';
import { EventParticipant } from './event-participant.entity';
import { Notification } from './notification.entity';
import { Minigame } from './minigame.entity';
import { ImportLog } from './import-log.entity';

export enum EventStatus {
  DRAFT = 0,         // Bản nháp
  PUBLISHED = 1,     // Đã xuất bản
  CLOSED = 2,        // Đã đóng
  CANCELLED = 3,     // Đã hủy
}

@Entity('events')
export class Event {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({ type: 'varchar', nullable: true })
  location_name?: string | null;

  @Column({ type: 'varchar', nullable: true })
  location?: string | null;

  @Column({ type: 'uuid', nullable: true })
  organizer_unit_id?: string | null;

  @ManyToOne(() => OrganizerUnit, (organizerUnit) => organizerUnit.events, {
    nullable: true,
  })
  @JoinColumn({ name: 'organizer_unit_id' })
  organizerUnit?: OrganizerUnit | null;

  @Column({ type: 'varchar', nullable: true })
  representative_name?: string | null;

  @Column({ type: 'varchar', nullable: true })
  representative_identity?: string | null;

  @Column({ type: 'int', default: EventStatus.DRAFT }) // 0: Bản nháp, 1: Đã xuất bản, 2: Đã đóng, 3: Đã hủy
  status: EventStatus;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string | null;

  @OneToMany(() => EventContent, (content) => content.event)
  contents: EventContent[];

  @OneToMany(() => EventDocument, (document) => document.event)
  documents: EventDocument[];

  @OneToMany(() => EventParticipant, (eventParticipant) => eventParticipant.event)
  eventParticipants: EventParticipant[];

  @OneToMany(() => Notification, (notification) => notification.event)
  notifications: Notification[];

  @OneToMany(() => Minigame, (minigame) => minigame.event)
  minigames: Minigame[];

  @OneToMany(() => ImportLog, (importLog) => importLog.event)
  importLogs: ImportLog[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
