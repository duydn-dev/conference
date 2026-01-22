import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';

export enum EventJobType {
  REMIND_BEFORE_1_DAY = 'REMIND_BEFORE_1_DAY',
  REMIND_BEFORE_4_HOURS = 'REMIND_BEFORE_4_HOURS',
  REMIND_BEFORE_1_HOUR = 'REMIND_BEFORE_1_HOUR',
  EVENT_STARTED = 'EVENT_STARTED',
}

export enum EventJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('event_jobs')
export class EventJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'varchar' })
  type: EventJobType;

  // Thời điểm cần chạy job
  @Column({ type: 'timestamptz' })
  run_at: Date;

  // URL gọi sang hệ thống ngoài (nếu không set sẽ dùng URL mặc định từ ENV)
  @Column({ type: 'varchar', nullable: true })
  callback_url?: string | null;

  // Payload gửi sang hệ thống ngoài (JSON)
  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, any> | null;

  @Column({ type: 'varchar', default: EventJobStatus.PENDING })
  status: EventJobStatus;

  @Column({ type: 'timestamptz', nullable: true })
  executed_at?: Date | null;

  @Column({ type: 'text', nullable: true })
  last_error?: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

