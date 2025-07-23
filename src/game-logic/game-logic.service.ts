import { Injectable } from '@nestjs/common';
import { CreateGameLogicDto } from './dto/create-game-logic.dto';
import { UpdateGameLogicDto } from './dto/update-game-logic.dto';

@Injectable()
export class GameLogicService {
  create(createGameLogicDto: CreateGameLogicDto) {
    return 'This action adds a new gameLogic';
  }

  findAll() {
    return `This action returns all gameLogic`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gameLogic`;
  }

  update(id: number, updateGameLogicDto: UpdateGameLogicDto) {
    return `This action updates a #${id} gameLogic`;
  }

  remove(id: number) {
    return `This action removes a #${id} gameLogic`;
  }
}
