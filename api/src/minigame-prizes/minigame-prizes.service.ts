import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigamePrizeDto } from './dto/create-minigame-prize.dto';
import { UpdateMinigamePrizeDto } from './dto/update-minigame-prize.dto';
import { MinigamePrize } from '../events/entities/minigame-prize.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigamePrizesService {
  constructor(
    @InjectRepository(MinigamePrize)
    private readonly minigamePrizesRepository: Repository<MinigamePrize>,
  ) {}

  async create(dto: CreateMinigamePrizeDto): Promise<MinigamePrize> {
    const id = dto.id ?? uuidv4();
    const entity = this.minigamePrizesRepository.create({
      ...dto,
      id,
    } as any);
    return this.minigamePrizesRepository.save(entity) as unknown as Promise<MinigamePrize>;
  }

  async findAll(): Promise<MinigamePrize[]> {
    return this.minigamePrizesRepository.find();
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { prize_name: ILike(`%${search}%`) },
          { minigame_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.minigamePrizesRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<MinigamePrize> {
    const minigamePrize = await this.minigamePrizesRepository.findOne({
      where: { id },
    });
    if (!minigamePrize) {
      throw new NotFoundException(`MinigamePrize with id ${id} not found`);
    }
    return minigamePrize;
  }

  async update(id: string, dto: UpdateMinigamePrizeDto): Promise<MinigamePrize> {
    const minigamePrize = await this.findOne(id);
    const merged = this.minigamePrizesRepository.merge(minigamePrize, dto as any);
    return this.minigamePrizesRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.minigamePrizesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`MinigamePrize with id ${id} not found`);
    }
  }
}
