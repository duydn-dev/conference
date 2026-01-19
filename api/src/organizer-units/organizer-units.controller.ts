import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrganizerUnitsService } from './organizer-units.service';
import { CreateOrganizerUnitDto } from './dto/create-organizer-unit.dto';
import { UpdateOrganizerUnitDto } from './dto/update-organizer-unit.dto';

@Controller('organizer-units')
export class OrganizerUnitsController {
  constructor(private readonly organizerUnitsService: OrganizerUnitsService) {}

  @Post()
  create(@Body() createOrganizerUnitDto: CreateOrganizerUnitDto) {
    return this.organizerUnitsService.create(createOrganizerUnitDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.organizerUnitsService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizerUnitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrganizerUnitDto: UpdateOrganizerUnitDto) {
    return this.organizerUnitsService.update(id, updateOrganizerUnitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizerUnitsService.remove(id);
  }
}
