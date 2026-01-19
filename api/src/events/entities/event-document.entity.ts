import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('event_documents')
export class EventDocument {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.documents)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'varchar' })
  file_name: string;

  @Column({ type: 'text' })
  file_path: string;

  @Column({ type: 'varchar', nullable: true })
  file_type?: string | null;

  @Column({ type: 'varchar', nullable: true })
  user_files?: string | null;

  @CreateDateColumn()
  uploaded_at: Date;
}

