import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigameResultDto } from './dto/create-minigame-result.dto';
import { UpdateMinigameResultDto } from './dto/update-minigame-result.dto';
import { MinigameResult } from '../events/entities/minigame-result.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigameResultsService {
  constructor(
    @InjectRepository(MinigameResult)
    private readonly minigameResultsRepository: Repository<MinigameResult>,
  ) {}

  async create(dto: CreateMinigameResultDto): Promise<MinigameResult> {
    const id = (dto as any).id ?? uuidv4();
    const entity = this.minigameResultsRepository.create({
      ...dto,
      id,
    } as any);
    return this.minigameResultsRepository.save(entity) as unknown as Promise<MinigameResult>;
  }

  async findAll(): Promise<MinigameResult[]> {
    return this.minigameResultsRepository.find({
      order: { drawn_at: 'DESC' },
    });
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { minigame_id: ILike(`%${search}%`) },
          { prize_id: ILike(`%${search}%`) },
          { participant_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.minigameResultsRepository.findAndCount({
      where,
      order: { drawn_at: 'DESC' },
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

  async findOne(id: string): Promise<MinigameResult> {
    const minigameResult = await this.minigameResultsRepository.findOne({
      where: { id },
    });
    if (!minigameResult) {
      throw new NotFoundException(`MinigameResult with id ${id} not found`);
    }
    return minigameResult;
  }

  async update(id: string, dto: UpdateMinigameResultDto): Promise<MinigameResult> {
    const minigameResult = await this.findOne(id);
    const merged = this.minigameResultsRepository.merge(minigameResult, dto as any);
    return this.minigameResultsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.minigameResultsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`MinigameResult with id ${id} not found`);
    }
  }
}
