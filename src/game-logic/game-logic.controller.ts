import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GameLogicService } from './game-logic.service';
import { CreateGameLogicDto } from './dto/create-game-logic.dto';
import { UpdateGameLogicDto } from './dto/update-game-logic.dto';

@Controller('game-logic')
export class GameLogicController {
  constructor(private readonly gameLogicService: GameLogicService) {}

  @Post()
  create(@Body() createGameLogicDto: CreateGameLogicDto) {
    return this.gameLogicService.create(createGameLogicDto);
  }

  @Get()
  findAll() {
    return this.gameLogicService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameLogicService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGameLogicDto: UpdateGameLogicDto) {
    return this.gameLogicService.update(+id, updateGameLogicDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gameLogicService.remove(+id);
  }
}
