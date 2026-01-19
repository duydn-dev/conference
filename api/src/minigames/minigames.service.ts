import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigameDto } from './dto/create-minigame.dto';
import { UpdateMinigameDto } from './dto/update-minigame.dto';
import { Minigame } from '../events/entities/minigame.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigamesService {
  constructor(
    @InjectRepository(Minigame)
    private readonly minigamesRepository: Repository<Minigame>,
  ) {}

  async create(dto: CreateMinigameDto): Promise<Minigame> {
    const id = dto.id ?? uuidv4();
    const entity = this.minigamesRepository.create({
      ...dto,
      id,
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
    } as any);
    return this.minigamesRepository.save(entity) as unknown as Promise<Minigame>;
  }

  async findAll(): Promise<Minigame[]> {
    return this.minigamesRepository.find({
      order: { start_time: 'ASC' },
    });
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { type: ILike(`%${search}%`) },
          { event_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.minigamesRepository.findAndCount({
      where,
      order: { start_time: 'ASC' },
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

  async findOne(id: string): Promise<Minigame> {
    const minigame = await this.minigamesRepository.findOne({
      where: { id },
    });
    if (!minigame) {
      throw new NotFoundException(`Minigame with id ${id} not found`);
    }
    return minigame;
  }

  async update(id: string, dto: UpdateMinigameDto): Promise<Minigame> {
    const minigame = await this.findOne(id);
    const merged = this.minigamesRepository.merge(minigame, {
      ...dto,
      start_time: dto.start_time ? new Date(dto.start_time as any) : minigame.start_time,
      end_time: dto.end_time ? new Date(dto.end_time as any) : minigame.end_time,
    } as any);
    return this.minigamesRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.minigamesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Minigame with id ${id} not found`);
    }
  }
}
