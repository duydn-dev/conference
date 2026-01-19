import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateEventParticipantDto } from './dto/create-event-participant.dto';
import { UpdateEventParticipantDto } from './dto/update-event-participant.dto';
import { EventParticipant } from '../events/entities/event-participant.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventParticipantsService {
  constructor(
    @InjectRepository(EventParticipant)
    private readonly eventParticipantsRepository: Repository<EventParticipant>,
  ) {}

  async create(dto: CreateEventParticipantDto): Promise<EventParticipant> {
    const id = dto.id ?? uuidv4();
    // Tạo số ngẫu nhiên từ 1000 đến 999999 nếu không được cung cấp
    const serial_number = dto.serial_number ?? Math.floor(Math.random() * (999999 - 1000 + 1)) + 1000;
    const entity = this.eventParticipantsRepository.create({
      ...dto,
      id,
      serial_number,
      checkin_time: dto.checkin_time ? new Date(dto.checkin_time) : null,
      checkout_time: dto.checkout_time ? new Date(dto.checkout_time) : null,
    } as any);
    return this.eventParticipantsRepository.save(entity) as unknown as Promise<EventParticipant>;
  }

  async findAll(): Promise<EventParticipant[]> {
    return this.eventParticipantsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { event_id: ILike(`%${search}%`) },
          { participant_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.eventParticipantsRepository.findAndCount({
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

  async findOne(id: string): Promise<EventParticipant> {
    const eventParticipant = await this.eventParticipantsRepository.findOne({
      where: { id },
    });
    if (!eventParticipant) {
      throw new NotFoundException(`EventParticipant with id ${id} not found`);
    }
    return eventParticipant;
  }

  async update(id: string, dto: UpdateEventParticipantDto): Promise<EventParticipant> {
    const eventParticipant = await this.findOne(id);
    const merged = this.eventParticipantsRepository.merge(eventParticipant, {
      ...dto,
      checkin_time: dto.checkin_time ? new Date(dto.checkin_time as any) : eventParticipant.checkin_time,
      checkout_time: dto.checkout_time ? new Date(dto.checkout_time as any) : eventParticipant.checkout_time,
    } as any);
    return this.eventParticipantsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventParticipantsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`EventParticipant with id ${id} not found`);
    }
  }
}
