import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateNotificationReceiverDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  notification_id: string;

  @IsUUID()
  participant_id: string;

  @IsOptional()
  sent_at?: string | Date;

  @IsOptional()
  read_at?: string | Date;
}
