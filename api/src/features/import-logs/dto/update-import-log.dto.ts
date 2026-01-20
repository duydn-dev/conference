import { PartialType } from '@nestjs/mapped-types';
import { CreateImportLogDto } from './create-import-log.dto';

export class UpdateImportLogDto extends PartialType(CreateImportLogDto) {}
