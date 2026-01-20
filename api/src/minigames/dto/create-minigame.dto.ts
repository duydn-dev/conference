import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { MinigameStatus } from '../entities/minigame.entity';

export class CreateMinigameDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  event_id: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  start_time: string | Date;

  @IsString()
  end_time: string | Date;

  @IsOptional()
  @IsEnum(MinigameStatus)
  status?: MinigameStatus;
}
