import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Event } from './event.entity';
import { Participant } from './participant.entity';

export enum ParticipantStatus {
  REGISTERED = 0,    // Đã đăng ký
  CHECKED_IN = 1,    // Đã check-in
  ABSENT = 2,        // Vắng mặt
}

export enum ImportSource {
  MANUAL = 0,        // Nhập thủ công
  EXCEL_IMPORT = 1,  // Import từ Excel
  API = 2,           // Từ API
}

@Entity('event_participants')
@Index(['event_id', 'participant_id'], { unique: true })
export class EventParticipant {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.eventParticipants)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'uuid' })
  participant_id: string;

  @ManyToOne(() => Participant, (participant) => participant.eventParticipants)
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ type: 'timestamp', nullable: true })
  checkin_time?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  checkout_time?: Date | null;

  @Column({ type: 'int', default: ParticipantStatus.REGISTERED }) // 0: Đã đăng ký, 1: Đã check-in, 2: Vắng mặt
  status: ParticipantStatus;

  @Column({ type: 'int', default: ImportSource.MANUAL }) // 0: Nhập thủ công, 1: Import từ Excel, 2: Từ API
  source: ImportSource;

  @Column({ type: 'int', nullable: true })
  serial_number?: number | null;

  @CreateDateColumn()
  created_at: Date;
}

