import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import { Event, EventStatus } from '../events/entities/event.entity';
import { EventJob, EventJobStatus, EventJobType } from './entities/event-job.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationReceiversService } from '../notification-receivers/notification-receivers.service';
import { EventParticipantsService } from '../event-participants/event-participants.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class EventJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventJobsService.name);
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(EventJob)
    private readonly jobsRepository: Repository<EventJob>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationReceiversService))
    private readonly notificationReceiversService: NotificationReceiversService,
    @Inject(forwardRef(() => EventParticipantsService))
    private readonly eventParticipantsService: EventParticipantsService,
  ) {}

  /**
   * Khởi động scheduler nội bộ (setInterval mỗi phút) khi module được init.
   */
  onModuleInit() {
    // Thay cho Cron: chạy mỗi phút
    const ONE_MINUTE = 60 * 1000;
    this.intervalHandle = setInterval(() => {
      this.processDueJobs().catch((err) =>
        this.logger.error('processDueJobs interval error', err?.stack || err),
      );
    }, ONE_MINUTE);
    this.logger.log('EventJobsService scheduler started (setInterval every 1 minute)');
  }

  /**
   * Dừng scheduler khi module bị destroy (shutdown app).
   */
  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.logger.log('EventJobsService scheduler stopped');
    }
  }

  /**
   * Tạo/cập nhật các job nhắc sự kiện (1 ngày, 4 giờ, 1 giờ trước giờ bắt đầu).
   */
  async scheduleEventReminderJobs(event: Event): Promise<void> {
    // Chỉ schedule khi sự kiện đã publish
    if (event.status !== EventStatus.PUBLISHED) {
      this.logger.debug(
        `Skip schedule jobs for event ${event.id} because status=${event.status} is not PUBLISHED`,
      );
      return;
    }

    const startTime = new Date(event.start_time);
    const now = new Date();

    const offsets: { type: EventJobType; diffMs: number }[] = [
      { type: EventJobType.REMIND_BEFORE_1_DAY, diffMs: -24 * 60 * 60 * 1000 },
      { type: EventJobType.REMIND_BEFORE_4_HOURS, diffMs: -4 * 60 * 60 * 1000 },
      { type: EventJobType.REMIND_BEFORE_1_HOUR, diffMs: -1 * 60 * 60 * 1000 },
      { type: EventJobType.EVENT_STARTED, diffMs: 0 }, // Job khi sự kiện bắt đầu
    ];

    for (const { type, diffMs } of offsets) {
      const runAt = new Date(startTime.getTime() + diffMs);

      // Nếu thời điểm đã qua thì bỏ qua
      if (runAt <= now) {
        this.logger.debug(
          `Skip job ${type} for event ${event.id} because runAt=${runAt.toISOString()} is in the past`,
        );
        continue;
      }

      await this.upsertEventJob(event, type, runAt);
    }
  }

  private async upsertEventJob(
    event: Event,
    type: EventJobType,
    runAt: Date,
  ): Promise<void> {
    // Tạo mới hoặc cập nhật lại một job cụ thể cho sự kiện (theo type + runAt)
    let job = await this.jobsRepository.findOne({
      where: { event_id: event.id, type },
    });

    if (!job) {
      job = this.jobsRepository.create({
        event_id: event.id,
        type,
        run_at: runAt,
        status: EventJobStatus.PENDING,
        payload: {
          eventId: event.id,
          eventCode: event.code,
          type,
        },
      });
      this.logger.log(
        `Creating event job ${type} for event ${event.id} at ${runAt.toISOString()}`,
      );
    } else {
      job.run_at = runAt;
      job.status = EventJobStatus.PENDING;
      job.executed_at = null;
      job.last_error = null;
      this.logger.log(
        `Updating event job ${type} for event ${event.id} to run at ${runAt.toISOString()}`,
      );
    }

    await this.jobsRepository.save(job);
  }

  /**
   * Quét DB tìm các job đến hạn (PENDING & run_at <= now) và thực thi lần lượt.
   */
  async processDueJobs(): Promise<void> {
    const now = new Date();

    try {
      const jobs = await this.jobsRepository.find({
        where: {
          status: EventJobStatus.PENDING,
          run_at: LessThanOrEqual(now),
        },
        take: 50,
        order: { run_at: 'ASC' },
      });

      if (!jobs.length) {
        return;
      }

      this.logger.log(`Found ${jobs.length} due event jobs to process`);

      for (const job of jobs) {
        await this.processSingleJob(job);
      }
    } catch (err: any) {
      // Nếu bảng event_jobs chưa tồn tại (DB mới chưa được migrate), tránh spam lỗi
      const message = err?.message || '';
      const code = err?.code || err?.driverError?.code;

      if (code === '42P01' || /relation ["']?event_jobs["']? does not exist/i.test(message)) {
        this.logger.warn(
          'Skip processing event jobs because table "event_jobs" does not exist yet. ' +
            'Run migrations to create schema before using the scheduler.',
        );
        return;
      }

      this.logger.error('processDueJobs unexpected error', err?.stack || err);
      throw err;
    }
  }

  /**
   * Xử lý 1 job: gọi API sang hệ thống ngoài, cập nhật trạng thái/thời điểm chạy.
   */
  private async processSingleJob(job: EventJob): Promise<void> {
    this.logger.debug(
      `Processing job ${job.id} (event=${job.event_id}, type=${job.type})`,
    );

    job.status = EventJobStatus.PROCESSING;
    await this.jobsRepository.save(job);

    // Đảm bảo chỉ gửi thông báo cho sự kiện ĐÃ XUẤT BẢN
    const event = await this.eventsRepository.findOne({
      where: { id: job.event_id },
    });

    if (!event) {
      this.logger.warn(
        `Skip job ${job.id} because event ${job.event_id} not found`,
      );
      job.status = EventJobStatus.FAILED;
      job.last_error = 'Event not found';
      await this.jobsRepository.save(job);
      return;
    }

    if (event.status !== EventStatus.PUBLISHED) {
      this.logger.debug(
        `Skip job ${job.id} because event ${job.event_id} status=${event.status} is not PUBLISHED`,
      );
      // Đánh dấu là hoàn thành (không cần gửi nữa) để không lặp lại
      job.status = EventJobStatus.COMPLETED;
      job.executed_at = new Date();
      job.last_error = null;
      await this.jobsRepository.save(job);
      return;
    }

    const defaultUrl =
      this.configService.get<string>('EXTERNAL_EVENT_NOTIFY_URL') || '';
    const url = job.callback_url || defaultUrl;

    if (!url) {
      this.logger.error(
        `No callback URL configured for job ${job.id}. Set EXTERNAL_EVENT_NOTIFY_URL or callback_url`,
      );
      job.status = EventJobStatus.FAILED;
      job.last_error = 'No callback URL configured';
      await this.jobsRepository.save(job);
      return;
    }

    // Tạo notification với message phù hợp
    let notificationMessage = '';
    let notificationTitle = '';

    const startTime = new Date(event.start_time);
    const formattedDate = this.formatVietnameseDate(startTime);
    const formattedTime = this.formatVietnameseTime(startTime);

    switch (job.type) {
      case EventJobType.REMIND_BEFORE_1_DAY:
        notificationMessage = `Sự kiện ${event.name} được tổ chức vào ${formattedDate} lúc ${formattedTime}, vui lòng chú ý`;
        notificationTitle = `Nhắc nhở sự kiện ${event.name}`;
        break;
      case EventJobType.REMIND_BEFORE_4_HOURS:
        notificationMessage = `Sự kiện ${event.name} được tổ chức vào 4 giờ nữa, vui lòng chú ý`;
        notificationTitle = `Nhắc nhở sự kiện ${event.name}`;
        break;
      case EventJobType.REMIND_BEFORE_1_HOUR:
        notificationMessage = `Sự kiện ${event.name} sẽ diễn sau 1 giờ nữa, vui lòng chú ý`;
        notificationTitle = `Nhắc nhở sự kiện ${event.name}`;
        break;
      case EventJobType.EVENT_STARTED:
        notificationMessage = `Sự kiện ${event.name} đã bắt đầu`;
        notificationTitle = `Sự kiện ${event.name} đã bắt đầu`;
        break;
    }

    // Tạo notification trong database
    let notification;
    try {
      notification = await this.notificationsService.create({
        event_id: event.id,
        title: notificationTitle,
        message: notificationMessage,
        type: NotificationType.REMINDER,
        scheduled_time: job.run_at,
      });

      // Lấy danh sách participants của event và tạo notification receivers
      const eventParticipants = await this.eventParticipantsService.findByEventId(event.id);
      for (const ep of eventParticipants) {
        await this.notificationReceiversService.create({
          notification_id: notification.id,
          participant_id: ep.participant_id,
        });
      }

      this.logger.log(
        `Created notification ${notification.id} for event ${event.id} with ${eventParticipants.length} receivers`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to create notification for job ${job.id}: ${error.message}`,
        error.stack,
      );
      // Tiếp tục xử lý job dù có lỗi tạo notification
    }

    const body =
      job.payload || ({
        eventId: job.event_id,
        jobId: job.id,
        type: job.type,
        runAt: job.run_at.toISOString(),
        notificationId: notification?.id,
        message: notificationMessage,
      } as any);

    try {
      // Nếu là job EVENT_STARTED, cập nhật trạng thái event thành STARTED
      if (job.type === EventJobType.EVENT_STARTED) {
        // TODO: Kiểm tra có cột is_started hoặc status cần update không
        this.logger.log(
          `Event ${event.id} has started at ${job.run_at.toISOString()}`,
        );
      }

      // TODO: Gọi API hệ thống khác tại đây để gửi thông báo đến danh sách khách mời
      // Ví dụ: await this.sendNotificationToExternalSystem(event, notificationMessage, eventParticipants);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `HTTP ${response.status} ${response.statusText}: ${text || 'no body'}`,
        );
      }

      job.status = EventJobStatus.COMPLETED;
      job.executed_at = new Date();
      job.last_error = null;
      await this.jobsRepository.save(job);

      this.logger.log(
        `Job ${job.id} completed successfully (event=${job.event_id}, type=${job.type})`,
      );
    } catch (error: any) {
      this.logger.error(
        `Job ${job.id} failed: ${error.message}`,
        error.stack,
      );
      job.status = EventJobStatus.FAILED;
      job.last_error = error?.message || 'Unknown error';
      await this.jobsRepository.save(job);
    }
  }

  /**
   * Format ngày theo định dạng tiếng Việt: ngày/tháng/năm
   */
  private formatVietnameseDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format giờ theo định dạng tiếng Việt: xx giờ xx phút
   */
  private formatVietnameseTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours} giờ ${minutes} phút`;
  }

  /**
   * Kiểm tra xem sự kiện đã bắt đầu (không tính giây)
   * So sánh: startTime (phút) >= now (phút)
   */
  private hasEventStarted(eventStartTime: Date, nowTime: Date = new Date()): boolean {
    // Loại bỏ giây và ms
    const eventMinute = new Date(eventStartTime);
    eventMinute.setSeconds(0, 0);

    const nowMinute = new Date(nowTime);
    nowMinute.setSeconds(0, 0);

    return nowMinute >= eventMinute;
  }
}
