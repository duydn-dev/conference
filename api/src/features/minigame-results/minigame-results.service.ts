import { Injectable, NotFoundException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateMinigameResultDto } from './dto/create-minigame-result.dto';
import { UpdateMinigameResultDto } from './dto/update-minigame-result.dto';
import { MinigameResult } from './entities/minigame-result.entity';
import { EventParticipantsService } from '../event-participants/event-participants.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinigameResultsService {
  private readonly logger = new Logger(MinigameResultsService.name);

  constructor(
    @InjectRepository(MinigameResult)
    private readonly minigameResultsRepository: Repository<MinigameResult>,
    @Inject(forwardRef(() => EventParticipantsService))
    private readonly eventParticipantsService: EventParticipantsService,
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

  async findAllWithPagination(
    page = 1,
    limit = 10,
    search?: string,
    minigame_id?: string,
    participant_id?: string,
    prize_id?: string,
    loadRelations = false,
  ) {
    this.logger.debug(
      `Finding minigame results with pagination: page=${page}, limit=${limit}, search=${search || 'none'}, minigame_id=${minigame_id || 'none'}, relations=${loadRelations}`,
    );

    // Build where condition
    let where: any = {};

    if (minigame_id) {
      where.minigame_id = minigame_id;
    }

    if (participant_id) {
      where.participant_id = participant_id;
    }

    if (prize_id) {
      where.prize_id = prize_id;
    }

    // If search is provided, use OR conditions
    if (search && Object.keys(where).length === 0) {
      where = [
        { minigame_id: ILike(`%${search}%`) },
        { prize_id: ILike(`%${search}%`) },
        { participant_id: ILike(`%${search}%`) },
      ];
    }

    const [items, total] = await this.minigameResultsRepository.findAndCount({
      where,
      relations: loadRelations ? ['prize', 'participant', 'minigame'] : [],
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

  /**
   * Lấy kết quả minigame theo minigame_id, group theo prize và sắp xếp theo order
   */
  async findByMinigameId(minigameId: string): Promise<Array<{ prize: any; winners: any[] }>> {
    this.logger.debug(`Finding minigame results by minigame_id: ${minigameId}`);

    // Lấy minigame để có event_id
    const minigame = await this.minigameResultsRepository
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.minigame', 'minigame')
      .where('mr.minigame_id = :minigameId', { minigameId })
      .limit(1)
      .getOne();

    if (!minigame || !minigame.minigame) {
      this.logger.warn(`Minigame not found: ${minigameId}`);
      return [];
    }

    const eventId = minigame.minigame.event_id;

    // Lấy tất cả results
    const results = await this.minigameResultsRepository.find({
      where: { minigame_id: minigameId },
      relations: ['prize', 'participant'],
      order: { drawn_at: 'ASC' }, // Sắp xếp theo thời gian quay
    });

    // Lấy tất cả event_participants của event để map serial_number
    let eventParticipantsMap = new Map<string, number | null>();
    try {
      const eventParticipants = await this.eventParticipantsService.findAllWithPagination(
        1,
        10000, // Lấy tất cả
        undefined,
        eventId,
        undefined,
        false,
      );
      eventParticipants.data.forEach(ep => {
        eventParticipantsMap.set(ep.participant_id, ep.serial_number || null);
      });
    } catch (error) {
      this.logger.warn(`Failed to get event participants for event ${eventId}: ${error.message}`);
    }

    // Group results by prize
    const prizeMap = new Map<string, any[]>();

    for (const result of results) {
      const prizeId = result.prize_id;
      if (!prizeMap.has(prizeId)) {
        prizeMap.set(prizeId, []);
      }

      const serialNumber = eventParticipantsMap.get(result.participant_id) || null;

      prizeMap.get(prizeId)!.push({
        id: result.id,
        participant_id: result.participant_id,
        serial_number: serialNumber,
        participant: result.participant || null,
        drawn_at: result.drawn_at,
      });
    }

    // Convert to array and sort by prize order
    const groupedResults: Array<{ prize: any; winners: any[] }> = [];

    for (const [prizeId, winners] of prizeMap.entries()) {
      const firstResult = results.find(r => r.prize_id === prizeId);
      if (firstResult && firstResult.prize) {
        groupedResults.push({
          prize: {
            id: firstResult.prize.id,
            prize_name: firstResult.prize.prize_name,
            description: firstResult.prize.description,
            image: firstResult.prize.image,
            quantity: firstResult.prize.quantity,
            order: firstResult.prize.order || 0,
          },
          winners: winners.map(w => ({
            participant_id: w.participant_id,
            serial_number: w.serial_number,
            participant: w.participant,
            drawn_at: w.drawn_at,
          })),
        });
      }
    }

    // Sort by prize order
    groupedResults.sort((a, b) => (a.prize.order || 0) - (b.prize.order || 0));

    this.logger.log(`Found ${groupedResults.length} prize groups for minigame ${minigameId}`);
    return groupedResults;
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
