import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EventDocumentsService } from './event-documents.service';
import { CreateEventDocumentDto } from './dto/create-event-document.dto';
import { UpdateEventDocumentDto } from './dto/update-event-document.dto';

@Controller('event-documents')
export class EventDocumentsController {
  constructor(private readonly eventDocumentsService: EventDocumentsService) {}

  @Post()
  create(@Body() createEventDocumentDto: CreateEventDocumentDto) {
    return this.eventDocumentsService.create(createEventDocumentDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.eventDocumentsService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventDocumentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDocumentDto: UpdateEventDocumentDto) {
    return this.eventDocumentsService.update(id, updateEventDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventDocumentsService.remove(id);
  }
}
