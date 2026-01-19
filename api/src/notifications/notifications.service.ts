import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from '../events/entities/notification.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const id = dto.id ?? uuidv4();
    const entity = this.notificationsRepository.create({
      ...dto,
      id,
      scheduled_time: dto.scheduled_time ? new Date(dto.scheduled_time) : null,
    } as any);
    return this.notificationsRepository.save(entity) as unknown as Promise<Notification>;
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { title: ILike(`%${search}%`) },
          { message: ILike(`%${search}%`) },
          { event_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.notificationsRepository.findAndCount({
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

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return notification;
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    const merged = this.notificationsRepository.merge(notification, {
      ...dto,
      scheduled_time: dto.scheduled_time ? new Date(dto.scheduled_time as any) : notification.scheduled_time,
    } as any);
    return this.notificationsRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.notificationsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
  }
}
