import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateEventDocumentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  event_id: string;

  @IsString()
  file_name: string;

  @IsString()
  file_path: string;

  @IsOptional()
  @IsString()
  file_type?: string;

  @IsOptional()
  @IsString()
  user_files?: string;
}
