import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ImportLogsService } from './import-logs.service';
import { CreateImportLogDto } from './dto/create-import-log.dto';
import { UpdateImportLogDto } from './dto/update-import-log.dto';

@Controller('import-logs')
export class ImportLogsController {
  constructor(private readonly importLogsService: ImportLogsService) {}

  @Post()
  create(@Body() createImportLogDto: CreateImportLogDto) {
    return this.importLogsService.create(createImportLogDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.importLogsService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importLogsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImportLogDto: UpdateImportLogDto) {
    return this.importLogsService.update(id, updateImportLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.importLogsService.remove(id);
  }
}
