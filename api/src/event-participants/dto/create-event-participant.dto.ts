import { IsString, IsOptional, IsUUID, IsEnum, IsInt } from 'class-validator';
import { ParticipantStatus, ImportSource } from '../entities/event-participant.entity';

export class CreateEventParticipantDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  event_id: string;

  @IsUUID()
  participant_id: string;

  @IsOptional()
  checkin_time?: string | Date;

  @IsOptional()
  checkout_time?: string | Date;

  @IsOptional()
  @IsEnum(ParticipantStatus)
  status?: ParticipantStatus;

  @IsOptional()
  @IsEnum(ImportSource)
  source?: ImportSource;

  @IsOptional()
  @IsInt()
  serial_number?: number;
}
