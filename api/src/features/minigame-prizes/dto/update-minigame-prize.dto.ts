import { PartialType } from '@nestjs/mapped-types';
import { CreateMinigamePrizeDto } from './create-minigame-prize.dto';

export class UpdateMinigamePrizeDto extends PartialType(CreateMinigamePrizeDto) {}
