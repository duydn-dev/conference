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
    @Query('minigame_id') minigame_id?: string,
    @Query('participant_id') participant_id?: string,
    @Query('prize_id') prize_id?: string,
    @Query('relations') relations?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const shouldLoadRelations = relations === 'true';
    return this.minigameResultsService.findAllWithPagination(
      pageNum,
      limitNum,
      search,
      minigame_id,
      participant_id,
      prize_id,
      shouldLoadRelations,
    );
  }

  @Get('by-minigame/:minigameId')
  findByMinigameId(@Param('minigameId') minigameId: string) {
    return this.minigameResultsService.findByMinigameId(minigameId);
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
