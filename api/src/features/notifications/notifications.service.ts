import { Injectable, NotFoundException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, In } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationReceiver } from '../notification-receivers/entities/notification-receiver.entity';
import { Event } from '../events/entities/event.entity';
import { SocketGateway } from '../../common/socket/socket.gateway';
import { SocketService } from '../../common/socket/socket.service';
import { EventParticipantsService } from '../event-participants/event-participants.service';
import { NotificationReceiversService } from '../notification-receivers/notification-receivers.service';
import { ParticipantStatus } from '../event-participants/entities/event-participant.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(NotificationReceiver)
    private readonly notificationReceiversRepository: Repository<NotificationReceiver>,
    private readonly socketGateway: SocketGateway,
    private readonly socketService: SocketService,
    @Inject(forwardRef(() => EventParticipantsService))
    private readonly eventParticipantsService: EventParticipantsService,
    private readonly notificationReceiversService: NotificationReceiversService,
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

  /**
   * Lấy notifications của một participant cụ thể (thông qua NotificationReceiver)
   */
  async findByParticipantId(participantId: string, page = 1, limit = 10, relations = false) {
    this.logger.debug(`Finding notifications for participant: ${participantId}, page=${page}, limit=${limit}, relations=${relations}`);
    
    // Lấy tất cả NotificationReceiver của participant này
    const receivers = await this.notificationReceiversRepository.find({
      where: { participant_id: participantId },
      order: { sent_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const notificationIds = receivers.map(r => r.notification_id);
    
    if (notificationIds.length === 0) {
      this.logger.debug(`No notifications found for participant ${participantId}`);
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

    // Lấy tổng số để tính pagination
    const totalReceivers = await this.notificationReceiversRepository.count({
      where: { participant_id: participantId },
    });

    // Lấy notifications với relations nếu cần
    const notifications = await this.notificationsRepository.find({
      where: { id: In(notificationIds) },
      relations: relations ? ['event', 'event.organizerUnit'] : undefined,
      order: { created_at: 'DESC' },
    });

    // Map lại để giữ thứ tự theo sent_at và thêm thông tin read_at
    const notificationsWithReadStatus = notifications.map(notification => {
      const receiver = receivers.find(r => r.notification_id === notification.id);
      return {
        ...notification,
        read_at: receiver?.read_at || null,
        sent_at: receiver?.sent_at || null,
      };
    });

    // Sắp xếp lại theo sent_at (mới nhất trước)
    notificationsWithReadStatus.sort((a, b) => {
      const aTime = a.sent_at ? new Date(a.sent_at).getTime() : 0;
      const bTime = b.sent_at ? new Date(b.sent_at).getTime() : 0;
      return bTime - aTime;
    });

    this.logger.log(`Found ${totalReceivers} notifications for participant ${participantId} (returning ${notificationsWithReadStatus.length} items)`);
    
    return {
      data: notificationsWithReadStatus,
      pagination: {
        page,
        limit,
        total: totalReceivers,
        totalPages: Math.ceil(totalReceivers / limit),
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
   * Gửi notification qua Socket.IO đến participant
   */
  private async sendNotificationViaSocket(participantId: string, notification: Notification): Promise<void> {
    this.logger.log(`[SEND_NOTIFICATION] Attempting to send notification ${notification.id} to participant ${participantId}`);
    this.logger.debug(`[SEND_NOTIFICATION] Notification details: title="${notification.title}", event_id=${notification.event_id}`);
    
    try {
      const socketIds = this.socketService.getSocketIds(participantId);
      this.logger.debug(`[SEND_NOTIFICATION] Found ${socketIds.length} socket(s) for participant ${participantId}`);
      
      if (socketIds.length > 0) {
        const notificationData = {
          id: notification.id,
          event_id: notification.event_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          created_at: notification.created_at,
        };
        
        socketIds.forEach((socketId, index) => {
          this.logger.log(`[SEND_NOTIFICATION] Emitting 'notification' event to socket ${socketId} (${index + 1}/${socketIds.length})`);
          this.socketGateway.server.to(socketId).emit('notification', notificationData);
          this.logger.debug(`[SEND_NOTIFICATION] Notification data: ${JSON.stringify(notificationData)}`);
        });
        
        this.logger.log(`[SEND_NOTIFICATION] ✅ Successfully sent notification ${notification.id} to participant ${participantId} via ${socketIds.length} socket(s)`);
      } else {
        this.logger.warn(`[SEND_NOTIFICATION] ⚠️ Participant ${participantId} is not connected via Socket.IO - notification will not be delivered in real-time`);
        this.logger.debug(`[SEND_NOTIFICATION] Notification ${notification.id} will be available when participant connects and loads notifications`);
      }
    } catch (error) {
      this.logger.error(`[SEND_NOTIFICATION] ❌ Failed to send notification ${notification.id} via Socket.IO: ${error.message}`);
      this.logger.error(`[SEND_NOTIFICATION] Error stack: ${error.stack}`);
    }
  }

  /**
   * Gửi notification đến nhiều participants
   */
  private async sendNotificationToParticipants(participantIds: string[], notification: Notification): Promise<void> {
    this.logger.log(`[SEND_NOTIFICATION] Sending notification ${notification.id} to ${participantIds.length} participant(s)`);
    this.logger.debug(`[SEND_NOTIFICATION] Participant IDs: ${JSON.stringify(participantIds)}`);
    
    let successCount = 0;
    let offlineCount = 0;
    
    for (let i = 0; i < participantIds.length; i++) {
      const participantId = participantIds[i];
      this.logger.debug(`[SEND_NOTIFICATION] Processing participant ${i + 1}/${participantIds.length}: ${participantId}`);
      
      const socketIds = this.socketService.getSocketIds(participantId);
      if (socketIds.length > 0) {
        successCount++;
      } else {
        offlineCount++;
      }
      
      await this.sendNotificationViaSocket(participantId, notification);
    }
    
    this.logger.log(`[SEND_NOTIFICATION] ✅ Completed sending notification ${notification.id}: ${successCount} online, ${offlineCount} offline`);
  }

  /**
   * Tạo notification khi thêm mới sự kiện.
   * Gửi thông báo qua Socket.IO đến tất cả participants của event (bao gồm cả ABSENT).
   */
  async createEventCreatedNotification(event: Event): Promise<Notification> {
    this.logger.log(`[CREATE_NOTIFICATION] Creating event created notification for event: ${event.id} - ${event.name}`);
    
    const organizerName = event.organizerUnit?.name || 'Đơn vị tổ chức';

    const start = event.start_time instanceof Date ? event.start_time : new Date(event.start_time);
    const dateStr = start.toLocaleDateString('vi-VN');
    const timeStr = start.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const message = `Kính gửi Quý đại biểu,\n\n${organizerName} trân trọng thông báo về việc mời Quý đại biểu tham gia sự kiện "${event.name}" được tổ chức vào ngày ${dateStr} lúc ${timeStr}.\n\nTrân trọng kính mời Quý đại biểu tham dự.`;

    this.logger.debug(`[CREATE_NOTIFICATION] Notification message: ${message}`);

    const notification = await this.create({
      event_id: event.id,
      title: `Thông báo mời tham gia sự kiện "${event.name}"`,
      message,
      type: NotificationType.REMINDER,
    });

    this.logger.log(`[CREATE_NOTIFICATION] ✅ Notification created: ${notification.id} - ${notification.title}`);

    // Gửi thông báo qua Socket.IO và tạo NotificationReceiver cho TẤT CẢ participants
    try {
      this.logger.log(`[CREATE_NOTIFICATION] Fetching event participants for event ${event.id}...`);
      const eventParticipants = await this.eventParticipantsService.findByEventId(event.id, false);
      const participantIds = eventParticipants.map(ep => ep.participant_id);
      this.logger.log(`[CREATE_NOTIFICATION] Found ${participantIds.length} participants for event ${event.id}`);
      
      // Tạo NotificationReceiver cho tất cả participants
      this.logger.log(`[CREATE_NOTIFICATION] Creating NotificationReceiver entries for ${participantIds.length} participants...`);
      let receiverSuccessCount = 0;
      let receiverErrorCount = 0;
      
      for (const participantId of participantIds) {
        try {
          await this.notificationReceiversService.create({
            notification_id: notification.id,
            participant_id: participantId,
            sent_at: new Date(),
          });
          receiverSuccessCount++;
        } catch (error) {
          receiverErrorCount++;
          this.logger.warn(`[CREATE_NOTIFICATION] Failed to create notification receiver for participant ${participantId}: ${error.message}`);
        }
      }
      
      this.logger.log(`[CREATE_NOTIFICATION] NotificationReceiver creation: ${receiverSuccessCount} success, ${receiverErrorCount} errors`);
      
      // Gửi qua Socket.IO đến tất cả participants (bao gồm cả ABSENT)
      this.logger.log(`[CREATE_NOTIFICATION] Sending notification via Socket.IO to ${participantIds.length} participants...`);
      await this.sendNotificationToParticipants(participantIds, notification);
      this.logger.log(`[CREATE_NOTIFICATION] ✅ Completed: Sent event created notification to ${participantIds.length} participants via Socket.IO and created ${receiverSuccessCount} notification receivers`);
    } catch (error) {
      this.logger.error(`[CREATE_NOTIFICATION] ❌ Failed to send event created notification via Socket.IO: ${error.message}`, error.stack);
    }

    return notification;
  }

  /**
   * Tạo notification khi chỉnh sửa sự kiện.
   * Gửi thông báo qua Socket.IO đến tất cả participants của event (bao gồm cả ABSENT).
   */
  async createEventUpdatedNotification(event: Event): Promise<Notification> {
    this.logger.log(`[CREATE_NOTIFICATION] Creating event updated notification for event: ${event.id} - ${event.name}`);
    
    const organizerName = event.organizerUnit?.name || 'Đơn vị tổ chức';

    const message = `Kính gửi Quý đại biểu,\n\n${organizerName} trân trọng thông báo về việc cập nhật thông tin sự kiện "${event.name}".\n\nQuý đại biểu vui lòng kiểm tra lại thông tin sự kiện để cập nhật các thay đổi mới nhất.\n\nTrân trọng.`;

    this.logger.debug(`[CREATE_NOTIFICATION] Notification message: ${message}`);

    const notification = await this.create({
      event_id: event.id,
      title: `Thông báo về việc cập nhật thông tin sự kiện "${event.name}"`,
      message,
      type: NotificationType.CHANGE,
    });

    this.logger.log(`[CREATE_NOTIFICATION] ✅ Notification created: ${notification.id} - ${notification.title}`);

    // Gửi thông báo qua Socket.IO và tạo NotificationReceiver cho TẤT CẢ participants
    try {
      this.logger.log(`[CREATE_NOTIFICATION] Fetching event participants for event ${event.id}...`);
      const eventParticipants = await this.eventParticipantsService.findByEventId(event.id, false);
      const participantIds = eventParticipants.map(ep => ep.participant_id);
      this.logger.log(`[CREATE_NOTIFICATION] Found ${participantIds.length} participants for event ${event.id}`);
      
      // Tạo NotificationReceiver cho tất cả participants
      this.logger.log(`[CREATE_NOTIFICATION] Creating NotificationReceiver entries for ${participantIds.length} participants...`);
      let receiverSuccessCount = 0;
      let receiverErrorCount = 0;
      
      for (const participantId of participantIds) {
        try {
          await this.notificationReceiversService.create({
            notification_id: notification.id,
            participant_id: participantId,
            sent_at: new Date(),
          });
          receiverSuccessCount++;
        } catch (error) {
          receiverErrorCount++;
          this.logger.warn(`[CREATE_NOTIFICATION] Failed to create notification receiver for participant ${participantId}: ${error.message}`);
        }
      }
      
      this.logger.log(`[CREATE_NOTIFICATION] NotificationReceiver creation: ${receiverSuccessCount} success, ${receiverErrorCount} errors`);
      
      // Gửi qua Socket.IO đến tất cả participants (bao gồm cả ABSENT)
      this.logger.log(`[CREATE_NOTIFICATION] Sending notification via Socket.IO to ${participantIds.length} participants...`);
      await this.sendNotificationToParticipants(participantIds, notification);
      this.logger.log(`[CREATE_NOTIFICATION] ✅ Completed: Sent event updated notification to ${participantIds.length} participants via Socket.IO and created ${receiverSuccessCount} notification receivers`);
    } catch (error) {
      this.logger.error(`[CREATE_NOTIFICATION] ❌ Failed to send event updated notification via Socket.IO: ${error.message}`, error.stack);
    }

    return notification;
  }
}
