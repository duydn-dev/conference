import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateEventContentDto } from './dto/create-event-content.dto';
import { UpdateEventContentDto } from './dto/update-event-content.dto';
import { EventContent } from '../events/entities/event-content.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventContentsService {
  constructor(
    @InjectRepository(EventContent)
    private readonly eventContentsRepository: Repository<EventContent>,
  ) {}

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { title: ILike(`%${search}%`) },
          { content: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.eventContentsRepository.findAndCount({
      where,
      order: { order_no: 'ASC' },
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

  async create(dto: CreateEventContentDto): Promise<EventContent> {
    const id = dto.id ?? uuidv4();
    const entity = this.eventContentsRepository.create({
      ...dto,
      id,
      start_time: dto.start_time ? new Date(dto.start_time) : null,
      end_time: dto.end_time ? new Date(dto.end_time) : null,
    } as any);
    return this.eventContentsRepository.save(entity) as unknown as Promise<EventContent>;
  }

  async findOne(id: string): Promise<EventContent> {
    const eventContent = await this.eventContentsRepository.findOne({
      where: { id },
    });
    if (!eventContent) {
      throw new NotFoundException(`EventContent with id ${id} not found`);
    }
    return eventContent;
  }

  async update(id: string, dto: UpdateEventContentDto): Promise<EventContent> {
    const eventContent = await this.findOne(id);
    const merged = this.eventContentsRepository.merge(eventContent, {
      ...dto,
      start_time: dto.start_time ? new Date(dto.start_time as any) : eventContent.start_time,
      end_time: dto.end_time ? new Date(dto.end_time as any) : eventContent.end_time,
    } as any);
    return this.eventContentsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventContentsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`EventContent with id ${id} not found`);
    }
  }
}
