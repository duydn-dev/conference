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
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.minigamesService.findAllWithPagination(pageNum, limitNum, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.minigamesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMinigameDto: UpdateMinigameDto) {
    return this.minigamesService.update(id, updateMinigameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.minigamesService.remove(id);
  }
}
