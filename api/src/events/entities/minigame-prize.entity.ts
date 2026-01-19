import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Minigame } from './minigame.entity';
import { MinigameResult } from './minigame-result.entity';

@Entity('minigame_prizes')
export class MinigamePrize {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  minigame_id: string;

  @ManyToOne(() => Minigame, (minigame) => minigame.prizes)
  @JoinColumn({ name: 'minigame_id' })
  minigame: Minigame;

  @Column({ type: 'varchar' })
  prize_name: string;

  @Column({ type: 'int' })
  quantity: number;

  @OneToMany(() => MinigameResult, (result) => result.prize)
  results: MinigameResult[];
}

