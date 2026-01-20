import { PartialType } from '@nestjs/mapped-types';
import { CreateMinigameDto } from './create-minigame.dto';

export class UpdateMinigameDto extends PartialType(CreateMinigameDto) {}
