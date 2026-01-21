import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { Event } from '../events/entities/event.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const id = dto.id ?? uuidv4();
    this.logger.log(`Creating notification: ${dto.title} (id: ${id}, event: ${dto.event_id})`);

    try {
      const entity = this.notificationsRepository.create({
        ...dto,
        id,
        scheduled_time: dto.scheduled_time ? new Date(dto.scheduled_time) : null,
      } as any);
      const saved = await this.notificationsRepository.save(entity) as unknown as Notification;
      this.logger.log(`Notification created successfully: ${id} - ${saved.title}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack, { dto });
      throw error;
    }
  }

  async findAll(): Promise<Notification[]> {
    this.logger.debug('Finding all notifications');
    const notifications = await this.notificationsRepository.find({
      order: { created_at: 'DESC' },
    });
    this.logger.log(`Found ${notifications.length} notifications`);
    return notifications;
  }

  async findAllWithPagination(page = 1, limit = 10, search?: string, relations = false) {
    this.logger.debug(`Finding notifications with pagination: page=${page}, limit=${limit}, search=${search || 'none'}, relations=${relations}`);
    
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
      relations: relations ? ['event', 'event.organizerUnit'] : undefined,
    });

    this.logger.log(`Found ${total} notifications (returning ${items.length} items)`);
    
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
    this.logger.debug(`Finding notification by id: ${id}`);
    
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });
    if (!notification) {
      this.logger.warn(`Notification not found: ${id}`);
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    
    this.logger.debug(`Notification found: ${id} - ${notification.title}`);
    return notification;
  }

  async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
    this.logger.log(`Updating notification: ${id}`);
    
    try {
      const notification = await this.findOne(id);
      const merged = this.notificationsRepository.merge(notification, {
        ...dto,
        scheduled_time: dto.scheduled_time ? new Date(dto.scheduled_time as any) : notification.scheduled_time,
      } as any);
      const updated = await this.notificationsRepository.save(merged);
      this.logger.log(`Notification updated successfully: ${id} - ${updated.title}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update notification ${id}: ${error.message}`, error.stack, { id, dto });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting notification: ${id}`);
    
    const result = await this.notificationsRepository.delete(id);
    if (!result.affected) {
      this.logger.warn(`Notification not found for deletion: ${id}`);
      throw new NotFoundException(`Notification with id ${id} not found`);
    }

    this.logger.log(`Notification deleted successfully: ${id}`);
  }

  /**
   * Tạo notification khi thêm mới sự kiện.
   * Đồng thời là nơi bạn sẽ gọi sang API hệ thống khác để gửi thông báo cho danh sách khách mời.
   *
   * TODO: implement external notification API call (gửi tới danh sách khách mời)
   */
  async createEventCreatedNotification(event: Event): Promise<Notification> {
    const organizerName = event.organizerUnit?.name || 'Đơn vị tổ chức';

    const start = event.start_time instanceof Date ? event.start_time : new Date(event.start_time);
    const dateStr = start.toLocaleDateString('vi-VN');
    const timeStr = start.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const message = `${organizerName} đã mời bạn tham gia sự kiện ${event.name} vào ngày ${dateStr} lúc ${timeStr}, hãy kiểm tra`;

    // TODO: Gọi API hệ thống khác tại đây (gửi message + danh sách khách mời)
    // LƯU Ý: Khi gửi thông báo, cần loại trừ những participant có status = ABSENT (2)
    // Chỉ gửi cho những participant có status = REGISTERED (0) hoặc CHECKED_IN (1)

    return this.create({
      event_id: event.id,
      title: `Mời tham gia sự kiện ${event.name}`,
      message,
      type: NotificationType.REMINDER,
    });
  }

  /**
   * Tạo notification khi chỉnh sửa sự kiện.
   * Đồng thời là nơi bạn sẽ gọi sang API hệ thống khác để gửi thông báo cho danh sách khách mời.
   *
   * TODO: implement external notification API call (gửi tới danh sách khách mời)
   */
  async createEventUpdatedNotification(event: Event): Promise<Notification> {
    const organizerName = event.organizerUnit?.name || 'Đơn vị tổ chức';

    const message = `${organizerName} đã thay đổi thông tin sự kiện ${event.name}, hãy kiểm tra thông tin`;

    // TODO: Gọi API hệ thống khác tại đây (gửi message + danh sách khách mời)
    // LƯU Ý: Khi gửi thông báo, cần loại trừ những participant có status = ABSENT (2)
    // Chỉ gửi cho những participant có status = REGISTERED (0) hoặc CHECKED_IN (1)

    return this.create({
      event_id: event.id,
      title: `Thay đổi thông tin sự kiện ${event.name}`,
      message,
      type: NotificationType.CHANGE,
    });
  }
}
