import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotificationReceiversService } from './notification-receivers.service';
import { CreateNotificationReceiverDto } from './dto/create-notification-receiver.dto';
import { UpdateNotificationReceiverDto } from './dto/update-notification-receiver.dto';

@Controller('notification-receivers')
export class NotificationReceiversController {
  constructor(private readonly notificationReceiversService: NotificationReceiversService) {}

  @Post()
  create(@Body() createNotificationReceiverDto: CreateNotificationReceiverDto) {
    return this.notificationReceiversService.create(createNotificationReceiverDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.notificationReceiversService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationReceiversService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationReceiverDto: UpdateNotificationReceiverDto) {
    return this.notificationReceiversService.update(id, updateNotificationReceiverDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationReceiversService.remove(id);
  }
}
