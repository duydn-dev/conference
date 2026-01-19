import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { code: ILike(`%${search}%`) },
          { description: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.eventsRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
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

  async create(dto: CreateEventDto): Promise<Event> {
    const id = dto.id ?? uuidv4();

    const entity = this.eventsRepository.create({
      ...dto,
      id,
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
    } as any);

    return this.eventsRepository.save(entity) as unknown as Promise<Event>;
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    const merged = this.eventsRepository.merge(event, {
      ...dto,
      start_time: dto.start_time ? new Date(dto.start_time as any) : event.start_time,
      end_time: dto.end_time ? new Date(dto.end_time as any) : event.end_time,
    } as any);

    return this.eventsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
  }
}
