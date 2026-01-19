import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreateEventContentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  event_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  start_time?: string | Date;

  @IsOptional()
  end_time?: string | Date;

  @IsOptional()
  @IsInt()
  order_no?: number;
}
