import { PartialType } from '@nestjs/mapped-types';
import { CreateMinigameResultDto } from './create-minigame-result.dto';

export class UpdateMinigameResultDto extends PartialType(CreateMinigameResultDto) {}
