import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateNotificationReceiverDto } from './dto/create-notification-receiver.dto';
import { UpdateNotificationReceiverDto } from './dto/update-notification-receiver.dto';
import { NotificationReceiver } from './entities/notification-receiver.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationReceiversService {
  private readonly logger = new Logger(NotificationReceiversService.name);

  constructor(
    @InjectRepository(NotificationReceiver)
    private readonly notificationReceiversRepository: Repository<NotificationReceiver>,
  ) {}

  async create(dto: CreateNotificationReceiverDto): Promise<NotificationReceiver> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating notification receiver: notification=${dto.notification_id}, participant=${dto.participant_id} (id: ${id})`);

    try {
      const entity = this.notificationReceiversRepository.create({
        ...dto,
        id,
        sent_at: dto.sent_at ? new Date(dto.sent_at) : null,
        read_at: dto.read_at ? new Date(dto.read_at) : null,
      } as any);
      const saved = await this.notificationReceiversRepository.save(entity) as unknown as NotificationReceiver;
      this.logger.log(`Notification receiver created successfully: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create notification receiver: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<NotificationReceiver[]> {
    this.logger.debug('Finding all notification receivers');
    const receivers = await this.notificationReceiversRepository.find();
    this.logger.log(`Found ${receivers.length} notification receivers`);
    return receivers;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string) {
    this.logger.debug(`Finding notification receivers with pagination: page=${page}, limit=${limit}, search=${search || 'none'}`);
    
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

    this.logger.log(`Found ${total} notification receivers (returning ${items.length} items)`);
    
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
    this.logger.debug(`Finding notification receiver by id: ${id}`);
    
    const notificationReceiver = await this.notificationReceiversRepository.findOne({
      where: { id },
    });
    if (!notificationReceiver) {
      this.logger.warn(`Notification receiver not found: ${id}`);
      throw new NotFoundException(`NotificationReceiver with id ${id} not found`);
    }
    
    this.logger.debug(`Notification receiver found: ${id}`);
    return notificationReceiver;
  }

  async update(id: string, dto: UpdateNotificationReceiverDto): Promise<NotificationReceiver> {
    this.logger.log(`Updating notification receiver: ${id}`);
    
    try {
      const notificationReceiver = await this.findOne(id);
      const merged = this.notificationReceiversRepository.merge(notificationReceiver, {
        ...dto,
        sent_at: dto.sent_at ? new Date(dto.sent_at as any) : notificationReceiver.sent_at,
        read_at: dto.read_at ? new Date(dto.read_at as any) : notificationReceiver.read_at,
      } as any);
      const updated = await this.notificationReceiversRepository.save(merged);
      this.logger.log(`Notification receiver updated successfully: ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update notification receiver ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting notification receiver: ${id}`);
    
    const result = await this.notificationReceiversRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Notification receiver not found for deletion: ${id}`);
      throw new NotFoundException(`NotificationReceiver with id ${id} not found`);
    }

    this.logger.log(`Notification receiver deleted successfully: ${id}`);
  }

  /**
   * Đánh dấu tất cả receiver của một notification là đã đọc (set read_at = now).
   */
  async markAllAsReadByNotification(notificationId: string): Promise<{ affected: number }> {
    this.logger.log(`Marking notification receivers as read for notification: ${notificationId}`);

    const result = await this.notificationReceiversRepository
      .createQueryBuilder()
      .update(NotificationReceiver)
      .set({ read_at: () => 'NOW()' })
      .where('notification_id = :notificationId', { notificationId })
      .andWhere('read_at IS NULL')
      .execute();

    this.logger.log(`Marked ${result.affected || 0} notification receivers as read for notification ${notificationId}`);

    return { affected: result.affected || 0 };
  }
}
