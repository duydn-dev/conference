import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EventParticipantsService } from './event-participants.service';
import { CreateEventParticipantDto } from './dto/create-event-participant.dto';
import { UpdateEventParticipantDto } from './dto/update-event-participant.dto';

@Controller('event-participants')
export class EventParticipantsController {
  constructor(private readonly eventParticipantsService: EventParticipantsService) {}

  @Post()
  create(@Body() createEventParticipantDto: CreateEventParticipantDto) {
    return this.eventParticipantsService.create(createEventParticipantDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.eventParticipantsService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventParticipantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventParticipantDto: UpdateEventParticipantDto) {
    return this.eventParticipantsService.update(id, updateEventParticipantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventParticipantsService.remove(id);
  }
}
