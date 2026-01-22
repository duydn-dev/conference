import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Event, EventStatus } from '../events/entities/event.entity';
import { EventParticipant } from '../event-participants/entities/event-participant.entity';
import { OrganizerUnit } from '../organizer-units/entities/organizer-unit.entity';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(EventParticipant)
    private readonly eventParticipantsRepository: Repository<EventParticipant>,
    @InjectRepository(OrganizerUnit)
    private readonly organizerUnitsRepository: Repository<OrganizerUnit>,
  ) {}

  async getStats() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [totalEvents, totalParticipants, finishedEvents, upcomingEvents] = await Promise.all([
      this.eventsRepository.count(),
      this.eventParticipantsRepository.count(),
      this.eventsRepository.count({
        where: {
          status: EventStatus.CLOSED,
        },
      }),
      this.eventsRepository.count({
        where: {
          status: EventStatus.PUBLISHED,
          start_time: MoreThanOrEqual(startOfToday),
        },
      }),
    ]);

    return {
      totalEvents,
      totalParticipants,
      activeEvents: finishedEvents,
      organizerUnits: upcomingEvents,
    };
  }

  async getEventsByStatus() {
    const [draft, published, closed, cancelled] = await Promise.all([
      this.eventsRepository.count({ where: { status: EventStatus.DRAFT } }),
      this.eventsRepository.count({ where: { status: EventStatus.PUBLISHED } }),
      this.eventsRepository.count({ where: { status: EventStatus.CLOSED } }),
      this.eventsRepository.count({ where: { status: EventStatus.CANCELLED } }),
    ]);

    return {
      labels: ['Bản nháp', 'Đã diễn ra', 'Đã đóng', 'Đã hủy'],
      series: [draft, published, closed, cancelled],
    };
  }

  async getEventsMonthly() {
    const now = new Date();
    const months: string[] = [];
    const monthlyCounts: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

      months.push(date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }));

      const count = await this.eventsRepository.count({
        where: {
          created_at: Between(monthStart, monthEnd),
        },
      });

      monthlyCounts.push(count);
    }

    return {
      categories: months,
      series: [
        {
          name: 'Sự kiện',
          data: monthlyCounts,
        },
      ],
    };
  }

  async getParticipantsOverTime() {
    const days: string[] = [];
    const dailyCounts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      days.push(date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }));

      const count = await this.eventParticipantsRepository.count({
        where: {
          created_at: Between(dayStart, dayEnd),
        },
      });

      dailyCounts.push(count);
    }

    return {
      categories: days,
      series: [
        {
          name: 'Người tham gia',
          data: dailyCounts,
        },
      ],
    };
  }

  async getTopOrganizers() {
    const topOrganizers = await this.eventsRepository
      .createQueryBuilder('event')
      .select('organizer_unit.name', 'name')
      .addSelect('COUNT(event.id)', 'count')
      .leftJoin('event.organizerUnit', 'organizer_unit')
      .where('organizer_unit.id IS NOT NULL')
      .groupBy('organizer_unit.id')
      .addGroupBy('organizer_unit.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const categories = topOrganizers.map((item) => item.name || 'Không xác định');
    const data = topOrganizers.map((item) => parseInt(item.count, 10));

    return {
      categories,
      series: [
        {
          name: 'Sự kiện',
          data,
        },
      ],
    };
  }

  async getRecentEvents() {
    const events = await this.eventsRepository.find({
      order: { start_time: 'DESC' },
      take: 10,
    });

    return {
      data: events,
    };
  }
}
