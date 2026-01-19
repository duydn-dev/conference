import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreateImportLogDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  event_id: string;

  @IsString()
  file_name: string;

  @IsOptional()
  @IsString()
  imported_by?: string;

  @IsInt()
  total_rows: number;

  @IsInt()
  success_rows: number;

  @IsInt()
  failed_rows: number;
}
