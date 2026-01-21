import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Minigame } from '../../minigames/entities/minigame.entity';
import { MinigameResult } from '../../minigame-results/entities/minigame-result.entity';

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

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', nullable: true })
  image?: string | null;

  @OneToMany(() => MinigameResult, (result) => result.prize)
  results: MinigameResult[];
}

