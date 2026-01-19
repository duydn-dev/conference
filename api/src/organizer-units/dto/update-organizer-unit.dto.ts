import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizerUnitDto } from './create-organizer-unit.dto';

export class UpdateOrganizerUnitDto extends PartialType(CreateOrganizerUnitDto) {}
