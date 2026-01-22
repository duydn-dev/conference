import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigamePrizeDto } from './dto/create-minigame-prize.dto';
import { UpdateMinigamePrizeDto } from './dto/update-minigame-prize.dto';
import { MinigamePrize } from './entities/minigame-prize.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigamePrizesService {
  private readonly logger = new Logger(MinigamePrizesService.name);

  constructor(
    @InjectRepository(MinigamePrize)
    private readonly minigamePrizesRepository: Repository<MinigamePrize>,
  ) { }

  async create(dto: CreateMinigamePrizeDto): Promise<MinigamePrize> {
    const id = dto.id?.trim() ? dto.id : uuidv4();

    // QUAN TRỌNG: Đảm bảo minigame_id không rỗng
    if (!dto.minigame_id || dto.minigame_id.trim() === '') {
      throw new BadRequestException('minigame_id is required');
    }

    this.logger.log(`Creating minigame prize: ${dto.prize_name} (id: ${id}, minigame: ${dto.minigame_id})`);

    try {
      const entity = this.minigamePrizesRepository.create({
        ...dto,
        id,
        // Đảm bảo không có chuỗi rỗng
        minigame_id: dto.minigame_id.trim()
      });

      const saved = await this.minigamePrizesRepository.save(entity);
      this.logger.log(`Minigame prize created successfully: ${id} - ${saved.prize_name}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create minigame prize: ${error.message}`, error.stack, { dto });

      // Xử lý lỗi UUID cụ thể
      if (error.message?.includes('invalid input syntax for type uuid')) {
        throw new BadRequestException('Invalid UUID format. Please check minigame_id.');
      }

      throw error;
    }
  }

  async findAll(): Promise<MinigamePrize[]> {
    this.logger.debug('Finding all minigame prizes');
    const prizes = await this.minigamePrizesRepository.find();
    this.logger.log(`Found ${prizes.length} minigame prizes`);
    return prizes;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding minigame prizes with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);

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

    this.logger.log(`Found ${total} minigame prizes (returning ${items.length} items)`);

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
    this.logger.debug(`Finding minigame prize by id: ${id}`);

    const minigamePrize = await this.minigamePrizesRepository.findOne({
      where: { id },
    });
    if (!minigamePrize) {
      this.logger.warn(`Minigame prize not found: ${id}`);
      throw new NotFoundException(`MinigamePrize with id ${id} not found`);
    }

    this.logger.debug(`Minigame prize found: ${id} - ${minigamePrize.prize_name}`);
    return minigamePrize;
  }

  async update(id: string, dto: UpdateMinigamePrizeDto): Promise<MinigamePrize> {
    this.logger.log(`Updating minigame prize: ${id}`);

    try {
      const minigamePrize = await this.findOne(id);
      this.logger.log('minigamePrize entity:', minigamePrize);
      
      const merged = this.minigamePrizesRepository.merge(minigamePrize, dto as any);
      this.logger.log('Merged entity:', merged);

      const updated = await this.minigamePrizesRepository.save(merged);
      this.logger.log('updated entity:', updated);

      this.logger.log(`Minigame prize updated successfully: ${id} - ${updated.prize_name}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update minigame prize ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting minigame prize: ${id}`);

    const result = await this.minigamePrizesRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Minigame prize not found for deletion: ${id}`);
      throw new NotFoundException(`MinigamePrize with id ${id} not found`);
    }

    this.logger.log(`Minigame prize deleted successfully: ${id}`);
  }
}
