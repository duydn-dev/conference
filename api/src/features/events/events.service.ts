import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, In } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { EventParticipant } from '../event-participants/entities/event-participant.entity';
import { EventJobsService } from '../event-jobs/event-jobs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ParticipantsService } from '../participants/participants.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(EventParticipant)
    private readonly eventParticipantsRepository: Repository<EventParticipant>,
    private readonly eventJobsService: EventJobsService,
    private readonly notificationsService: NotificationsService,
    private readonly participantsService: ParticipantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async findAllWithPagination(page = 1, limit = 10, search?: string, participantId?: string) {
    this.logger.debug(`Finding events with pagination: page=${page}, limit=${limit}, search=${search || 'none'}, participantId=${participantId || 'none'}`);
    
    let eventIds: string[] = [];
    
    // Nếu có participantId, filter events theo người đại diện hoặc được mời
    if (participantId) {
      try {
        // Lấy thông tin participant để có identity_number
        const participant = await this.participantsService.findOne(participantId);
        
        if (participant) {
          // 1. Lấy events mà người này là người đại diện (representative_identity = participant.identity_number)
          const eventsAsRepresentative = await this.eventsRepository.find({
            where: { representative_identity: participant.identity_number },
            select: ['id'],
          });
          
          // 2. Lấy events mà người này được mời tham gia (có trong EventParticipant)
          const eventParticipants = await this.eventParticipantsRepository.find({
            where: { participant_id: participantId },
            select: ['event_id'],
          });
          const eventIdsFromParticipants = eventParticipants.map(ep => ep.event_id);
          
          // Merge và loại bỏ duplicate
          eventIds = [
            ...eventsAsRepresentative.map(e => e.id),
            ...eventIdsFromParticipants,
          ];
          eventIds = [...new Set(eventIds)]; // Remove duplicates
          
          this.logger.debug(`Found ${eventIds.length} events for participant ${participantId} (${eventsAsRepresentative.length} as representative, ${eventIdsFromParticipants.length} as participant)`);
        }
      } catch (error) {
        this.logger.warn(`Failed to filter events by participant: ${error.message}`);
        // Nếu không tìm thấy participant, trả về empty array
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }
    
    // Build where condition
    const whereConditions: any[] = [];
    
    // Nếu có search, thêm điều kiện search
    if (search) {
      whereConditions.push(
        { name: ILike(`%${search}%`) },
        { code: ILike(`%${search}%`) },
        { description: ILike(`%${search}%`) },
      );
    }
    
    // Nếu có participantId và đã filter được eventIds, chỉ lấy các events đó
    if (participantId && eventIds.length > 0) {
      const searchConditions = search 
        ? [
            { id: In(eventIds), name: ILike(`%${search}%`) },
            { id: In(eventIds), code: ILike(`%${search}%`) },
            { id: In(eventIds), description: ILike(`%${search}%`) },
          ]
        : [{ id: In(eventIds) }];
      whereConditions.length = 0; // Clear previous conditions
      whereConditions.push(...searchConditions);
    } else if (participantId && eventIds.length === 0) {
      // Nếu có participantId nhưng không tìm thấy events nào, trả về empty
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
    
    const where = whereConditions.length > 0 ? whereConditions : {};
    
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

      // Tạo notification + hook để gọi API hệ thống khác khi thêm mới sự kiện
      try {
        await this.notificationsService.createEventCreatedNotification(savedEvent);
      } catch (notifyError) {
        this.logger.error(
          `Failed to create event created notification for event ${savedEvent.id}: ${notifyError.message}`,
          notifyError.stack,
        );
        // Không throw để tránh làm fail luôn API tạo sự kiện
      }

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

      // Tạo notification + hook để gọi API hệ thống khác khi chỉnh sửa sự kiện
      try {
        await this.notificationsService.createEventUpdatedNotification(updatedEvent);
      } catch (notifyError) {
        this.logger.error(
          `Failed to create event updated notification for event ${updatedEvent.id}: ${notifyError.message}`,
          notifyError.stack,
        );
        // Không throw để tránh làm fail luôn API cập nhật sự kiện
      }

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
