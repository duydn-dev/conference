import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { EventJobsService } from '../event-jobs/event-jobs.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    private readonly eventJobsService: EventJobsService,
  ) {}

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding events with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
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

    this.logger.log(`Found ${total} events (returning ${items.length} items)`);
    
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
    this.logger.log(`Creating new event: ${dto.name} (id: ${id})`);

    try {
      const entity = this.eventsRepository.create({
        ...dto,
        id,
        start_time: new Date(dto.start_time),
        end_time: new Date(dto.end_time),
      } as any);

      const savedEvent = (await this.eventsRepository.save(entity)) as unknown as Event;
      this.logger.log(`Event created successfully: ${savedEvent.id} - ${savedEvent.name}`);

      // Tạo các job nhắc sự kiện (1 ngày, 4h, 1h trước khi bắt đầu)
      await this.eventJobsService.scheduleEventReminderJobs(savedEvent);

      return savedEvent;
    } catch (error) {
      this.logger.error(`Failed to create event: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findOne(id: string): Promise<Event> {
    this.logger.debug(`Finding event by id: ${id}`);
    
    const event = await this.eventsRepository.findOne({
      where: { id },
    });

    if (!event) {
      this.logger.warn(`Event not found: ${id}`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    this.logger.debug(`Event found: ${event.id} - ${event.name}`);
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    this.logger.log(`Updating event: ${id}`);
    
    try {
      const event = await this.findOne(id);

      const merged = this.eventsRepository.merge(event, {
        ...dto,
        start_time: dto.start_time ? new Date(dto.start_time as any) : event.start_time,
        end_time: dto.end_time ? new Date(dto.end_time as any) : event.end_time,
      } as any);

      const updatedEvent = await this.eventsRepository.save(merged);
      this.logger.log(`Event updated successfully: ${id} - ${updatedEvent.name}`);

      // Cập nhật lại các job nhắc sự kiện khi thay đổi thời gian / trạng thái
      await this.eventJobsService.scheduleEventReminderJobs(updatedEvent);

      return updatedEvent;
    } catch (error) {
      this.logger.error(`Failed to update event ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting event: ${id}`);
    
    const result = await this.eventsRepository.delete(id);

    if (!result.affected) {
      this.logger.warn(`Event not found for deletion: ${id}`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    this.logger.log(`Event deleted successfully: ${id}`);
  }
}
