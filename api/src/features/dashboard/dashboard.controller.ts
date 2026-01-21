import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('events-by-status')
  getEventsByStatus() {
    return this.dashboardService.getEventsByStatus();
  }

  @Get('events-monthly')
  getEventsMonthly() {
    return this.dashboardService.getEventsMonthly();
  }

  @Get('participants-over-time')
  getParticipantsOverTime() {
    return this.dashboardService.getParticipantsOverTime();
  }

  @Get('top-organizers')
  getTopOrganizers() {
    return this.dashboardService.getTopOrganizers();
  }

  @Get('recent-events')
  getRecentEvents() {
    return this.dashboardService.getRecentEvents();
  }
}
