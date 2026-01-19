import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { NotificationType } from '../../events/entities/notification.entity';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  event_id: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  scheduled_time?: string | Date;
}
