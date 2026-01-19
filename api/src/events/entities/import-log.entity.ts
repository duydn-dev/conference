import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity('import_logs')
export class ImportLog {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.importLogs)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'varchar' })
  file_name: string;

  @Column({ type: 'varchar', nullable: true })
  imported_by?: string | null;

  @Column({ type: 'int' })
  total_rows: number;

  @Column({ type: 'int' })
  success_rows: number;

  @Column({ type: 'int' })
  failed_rows: number;

  @CreateDateColumn()
  imported_at: Date;
}

