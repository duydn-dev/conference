import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity('organizer_units')
export class OrganizerUnit {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  contact_person?: string | null;

  @Column({ type: 'varchar', nullable: true })
  contact_email?: string | null;

  @Column({ type: 'varchar', nullable: true })
  contact_phone?: string | null;

  @OneToMany(() => Event, (event) => event.organizerUnit)
  events: Event[];

  @CreateDateColumn()
  created_at: Date;
}

