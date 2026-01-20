import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigameDto } from './dto/create-minigame.dto';
import { UpdateMinigameDto } from './dto/update-minigame.dto';
import { Minigame } from './entities/minigame.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigamesService {
  private readonly logger = new Logger(MinigamesService.name);

  constructor(
    @InjectRepository(Minigame)
    private readonly minigamesRepository: Repository<Minigame>,
  ) {}

  async create(dto: CreateMinigameDto): Promise<Minigame> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating minigame: ${dto.name} (id: ${id}, event: ${dto.event_id})`);

    try {
      const entity = this.minigamesRepository.create({
        ...dto,
        id,
        start_time: new Date(dto.start_time),
        end_time: new Date(dto.end_time),
      } as any);
      const saved = await this.minigamesRepository.save(entity) as unknown as Minigame;
      this.logger.log(`Minigame created successfully: ${id} - ${saved.name}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create minigame: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<Minigame[]> {
    this.logger.debug('Finding all minigames');
    const minigames = await this.minigamesRepository.find({
      order: { start_time: 'ASC' },
    });
    this.logger.log(`Found ${minigames.length} minigames`);
    return minigames;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding minigames with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
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

    this.logger.log(`Found ${total} minigames (returning ${items.length} items)`);
    
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
    this.logger.debug(`Finding minigame by id: ${id}`);
    
    const minigame = await this.minigamesRepository.findOne({
      where: { id },
    });
    if (!minigame) {
      this.logger.warn(`Minigame not found: ${id}`);
      throw new NotFoundException(`Minigame with id ${id} not found`);
    }
    
    this.logger.debug(`Minigame found: ${id} - ${minigame.name}`);
    return minigame;
  }

  async update(id: string, dto: UpdateMinigameDto): Promise<Minigame> {
    this.logger.log(`Updating minigame: ${id}`);
    
    try {
      const minigame = await this.findOne(id);
      const merged = this.minigamesRepository.merge(minigame, {
        ...dto,
        start_time: dto.start_time ? new Date(dto.start_time as any) : minigame.start_time,
        end_time: dto.end_time ? new Date(dto.end_time as any) : minigame.end_time,
      } as any);
      const updated = await this.minigamesRepository.save(merged);
      this.logger.log(`Minigame updated successfully: ${id} - ${updated.name}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update minigame ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting minigame: ${id}`);
    
    const result = await this.minigamesRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Minigame not found for deletion: ${id}`);
      throw new NotFoundException(`Minigame with id ${id} not found`);
    }

    this.logger.log(`Minigame deleted successfully: ${id}`);
  }
}
