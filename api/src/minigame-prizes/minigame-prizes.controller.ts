import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MinigamePrizesService } from './minigame-prizes.service';
import { CreateMinigamePrizeDto } from './dto/create-minigame-prize.dto';
import { UpdateMinigamePrizeDto } from './dto/update-minigame-prize.dto';

@Controller('minigame-prizes')
export class MinigamePrizesController {
  constructor(private readonly minigamePrizesService: MinigamePrizesService) {}

  @Post()
  create(@Body() createMinigamePrizeDto: CreateMinigamePrizeDto) {
    return this.minigamePrizesService.create(createMinigamePrizeDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.minigamePrizesService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.minigamePrizesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMinigamePrizeDto: UpdateMinigamePrizeDto) {
    return this.minigamePrizesService.update(id, updateMinigamePrizeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.minigamePrizesService.remove(id);
  }
}
