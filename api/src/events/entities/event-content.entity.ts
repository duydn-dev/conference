import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('event_contents')
export class EventContent {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.contents)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  content?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  start_time?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  end_time?: Date | null;

  @Column({ type: 'int', nullable: true })
  order_no?: number | null;
}

