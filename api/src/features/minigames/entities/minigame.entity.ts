import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { MinigamePrize } from '../../minigame-prizes/entities/minigame-prize.entity';
import { MinigameResult } from '../../minigame-results/entities/minigame-result.entity';

export enum MinigameStatus {
  PENDING = 0,   // Chờ bắt đầu
  RUNNING = 1,   // Đang chạy
  FINISHED = 2,  // Đã kết thúc
}

@Entity('minigames')
export class Minigame {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.minigames)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({ type: 'int', default: MinigameStatus.PENDING }) // 0: Chờ bắt đầu, 1: Đang chạy, 2: Đã kết thúc
  status: MinigameStatus;

  @OneToMany(() => MinigamePrize, (prize) => prize.minigame)
  prizes: MinigamePrize[];

  @OneToMany(() => MinigameResult, (result) => result.minigame)
  results: MinigameResult[];
}

