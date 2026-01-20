import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('import-excel/:eventId')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    const XLSX = require('xlsx');
    
    try {
      // Parse Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        throw new BadRequestException('File Excel rỗng');
      }

      // Import data
      const result = await this.eventParticipantsService.importFromExcel(eventId, jsonData);
      
      return {
        message: 'Import thành công',
        total: jsonData.length,
        ...result
      };
    } catch (error) {
      throw new BadRequestException(`Lỗi khi import Excel: ${error.message}`);
    }
  }
}
