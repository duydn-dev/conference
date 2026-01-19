import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EventContentsService } from './event-contents.service';
import { CreateEventContentDto } from './dto/create-event-content.dto';
import { UpdateEventContentDto } from './dto/update-event-content.dto';

@Controller('event-contents')
export class EventContentsController {
  constructor(private readonly eventContentsService: EventContentsService) {}

  @Post()
  create(@Body() createEventContentDto: CreateEventContentDto) {
    return this.eventContentsService.create(createEventContentDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.eventContentsService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventContentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventContentDto: UpdateEventContentDto) {
    return this.eventContentsService.update(id, updateEventContentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventContentsService.remove(id);
  }
}
