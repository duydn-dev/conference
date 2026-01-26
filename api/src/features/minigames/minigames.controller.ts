import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MinigamesService } from './minigames.service';
import { CreateMinigameDto } from './dto/create-minigame.dto';
import { UpdateMinigameDto } from './dto/update-minigame.dto';

@Controller('minigames')
export class MinigamesController {
  constructor(private readonly minigamesService: MinigamesService) {}

  @Post()
  create(@Body() createMinigameDto: CreateMinigameDto) {
    return this.minigamesService.create(createMinigameDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('relations') relations?: string,
    @Query('event_id') event_id?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const shouldLoadRelations = relations === 'true';
    const statusNum = status ? parseInt(status, 10) : undefined;
    return this.minigamesService.findAllWithPagination(pageNum, limitNum, search, shouldLoadRelations, event_id, statusNum);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('relations') relations?: string,
  ) {
    const shouldLoadRelations = relations === 'true';
    return this.minigamesService.findOne(id, shouldLoadRelations);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMinigameDto: UpdateMinigameDto) {
    return this.minigamesService.update(id, updateMinigameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.minigamesService.remove(id);
  }

  @Post(':id/draw-prizes')
  drawPrizes(@Param('id') id: string) {
    return this.minigamesService.drawPrizes(id);
  }
}
