import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('relations') relations?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const includeRelations = relations === 'true';
    
    // Extract participantId from JWT token
    let participantId: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const secret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
        const payload = this.jwtService.verify(token, { secret });
        participantId = payload.sub || payload.id;
      } catch (error) {
        // Invalid token, ignore
        this.notificationsService['logger'].warn('Invalid JWT token in notifications request');
      }
    }
    
    // Nếu có participantId, chỉ lấy notifications của user đó
    if (participantId) {
      return this.notificationsService.findByParticipantId(participantId, pageNum, limitNum, includeRelations);
    }
    
    // Nếu không có token, trả về tất cả (cho admin hoặc backward compatibility)
    return this.notificationsService.findAllWithPagination(pageNum, limitNum, search, includeRelations);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
