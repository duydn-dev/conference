import { IsUUID } from 'class-validator';

export class CreateMinigameResultDto {
  @IsUUID()
  minigame_id: string;

  @IsUUID()
  prize_id: string;

  @IsUUID()
  participant_id: string;
}
