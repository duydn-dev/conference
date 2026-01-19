import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateNotificationReceiverDto } from './dto/create-notification-receiver.dto';
import { UpdateNotificationReceiverDto } from './dto/update-notification-receiver.dto';
import { NotificationReceiver } from '../events/entities/notification-receiver.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationReceiversService {
  constructor(
    @InjectRepository(NotificationReceiver)
    private readonly notificationReceiversRepository: Repository<NotificationReceiver>,
  ) {}

  async create(dto: CreateNotificationReceiverDto): Promise<NotificationReceiver> {
    const id = dto.id ?? uuidv4();
    const entity = this.notificationReceiversRepository.create({
      ...dto,
      id,
      sent_at: dto.sent_at ? new Date(dto.sent_at) : null,
      read_at: dto.read_at ? new Date(dto.read_at) : null,
    } as any);
    return this.notificationReceiversRepository.save(entity) as unknown as Promise<NotificationReceiver>;
  }

  async findAll(): Promise<NotificationReceiver[]> {
    return this.notificationReceiversRepository.find();
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    const where = search
      ? [
          { notification_id: ILike(`%${search}%`) },
          { participant_id: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.notificationReceiversRepository.findAndCount({
      where,
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

  async findOne(id: string): Promise<NotificationReceiver> {
    const notificationReceiver = await this.notificationReceiversRepository.findOne({
      where: { id },
    });
    if (!notificationReceiver) {
      throw new NotFoundException(`NotificationReceiver with id ${id} not found`);
    }
    return notificationReceiver;
  }

  async update(id: string, dto: UpdateNotificationReceiverDto): Promise<NotificationReceiver> {
    const notificationReceiver = await this.findOne(id);
    const merged = this.notificationReceiversRepository.merge(notificationReceiver, {
      ...dto,
      sent_at: dto.sent_at ? new Date(dto.sent_at as any) : notificationReceiver.sent_at,
      read_at: dto.read_at ? new Date(dto.read_at as any) : notificationReceiver.read_at,
    } as any);
    return this.notificationReceiversRepository.save(merged);
  }

  async remove(id: string): Promise<void> {
    const result = await this.notificationReceiversRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`NotificationReceiver with id ${id} not found`);
    }
  }
}
