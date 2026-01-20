import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigameResultDto } from './dto/create-minigame-result.dto';
import { UpdateMinigameResultDto } from './dto/update-minigame-result.dto';
import { MinigameResult } from './entities/minigame-result.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigameResultsService {
  private readonly logger = new Logger(MinigameResultsService.name);

  constructor(
    @InjectRepository(MinigameResult)
    private readonly minigameResultsRepository: Repository<MinigameResult>,
  ) {}

  async create(dto: CreateMinigameResultDto): Promise<MinigameResult> {
    const id = (dto as any).id ?? uuidv4();
    this.logger.log(`Creating minigame result: minigame=${dto.minigame_id}, participant=${dto.participant_id}, prize=${dto.prize_id} (id: ${id})`);

    try {
      const entity = this.minigameResultsRepository.create({
        ...dto,
        id,
      } as any);
      const saved = await this.minigameResultsRepository.save(entity) as unknown as MinigameResult;
      this.logger.log(`Minigame result created successfully: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create minigame result: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<MinigameResult[]> {
    this.logger.debug('Finding all minigame results');
    const results = await this.minigameResultsRepository.find({
      order: { drawn_at: 'DESC' },
    });
    this.logger.log(`Found ${results.length} minigame results`);
    return results;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding minigame results with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
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

    this.logger.log(`Found ${total} minigame results (returning ${items.length} items)`);
    
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
    this.logger.debug(`Finding minigame result by id: ${id}`);
    
    const minigameResult = await this.minigameResultsRepository.findOne({
      where: { id },
    });
    if (!minigameResult) {
      this.logger.warn(`Minigame result not found: ${id}`);
      throw new NotFoundException(`MinigameResult with id ${id} not found`);
    }
    
    this.logger.debug(`Minigame result found: ${id}`);
    return minigameResult;
  }

  async update(id: string, dto: UpdateMinigameResultDto): Promise<MinigameResult> {
    this.logger.log(`Updating minigame result: ${id}`);
    
    try {
      const minigameResult = await this.findOne(id);
      const merged = this.minigameResultsRepository.merge(minigameResult, dto as any);
      const updated = await this.minigameResultsRepository.save(merged);
      this.logger.log(`Minigame result updated successfully: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update minigame result ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting minigame result: ${id}`);
    
    const result = await this.minigameResultsRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Minigame result not found for deletion: ${id}`);
      throw new NotFoundException(`MinigameResult with id ${id} not found`);
    }

    this.logger.log(`Minigame result deleted successfully: ${id}`);
  }
}
