import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MinigameResultsService } from './minigame-results.service';
import { CreateMinigameResultDto } from './dto/create-minigame-result.dto';
import { UpdateMinigameResultDto } from './dto/update-minigame-result.dto';

@Controller('minigame-results')
export class MinigameResultsController {
  constructor(private readonly minigameResultsService: MinigameResultsService) {}

  @Post()
  create(@Body() createMinigameResultDto: CreateMinigameResultDto) {
    return this.minigameResultsService.create(createMinigameResultDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.minigameResultsService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.minigameResultsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMinigameResultDto: UpdateMinigameResultDto) {
    return this.minigameResultsService.update(id, updateMinigameResultDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.minigameResultsService.remove(id);
  }
}
