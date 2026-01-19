import { PartialType } from '@nestjs/mapped-types';
import { CreateEventContentDto } from './create-event-content.dto';

export class UpdateEventContentDto extends PartialType(CreateEventContentDto) {}
