import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreateMinigamePrizeDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  minigame_id: string;

  @IsString()
  prize_name: string;

  @IsInt()
  quantity: number;
}
