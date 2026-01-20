import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Minigame } from '../../minigames/entities/minigame.entity';
import { MinigamePrize } from '../../minigame-prizes/entities/minigame-prize.entity';
import { Participant } from '../../participants/entities/participant.entity';

@Entity('minigame_results')
export class MinigameResult {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  minigame_id: string;

  @ManyToOne(() => Minigame, (minigame) => minigame.results)
  @JoinColumn({ name: 'minigame_id' })
  minigame: Minigame;

  @Column({ type: 'uuid' })
  prize_id: string;

  @ManyToOne(() => MinigamePrize, (prize) => prize.results)
  @JoinColumn({ name: 'prize_id' })
  prize: MinigamePrize;

  @Column({ type: 'uuid' })
  participant_id: string;

  @ManyToOne(() => Participant, (participant) => participant.minigameResults)
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @CreateDateColumn()
  drawn_at: Date;
}

