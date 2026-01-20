import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateParticipantDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  identity_number: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsBoolean()
  is_receptionist?: boolean;
}
