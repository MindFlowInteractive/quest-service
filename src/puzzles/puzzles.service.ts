import { Injectable } from '@nestjs/common';
import { CreatePuzzleDto } from './dto/create-puzzle.dto';
import { UpdatePuzzleDto } from './dto/update-puzzle.dto';

@Injectable()
export class PuzzlesService {
  create(createPuzzleDto: CreatePuzzleDto) {
    return 'This action adds a new puzzle';
  }

  findAll() {
    return `This action returns all puzzles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} puzzle`;
  }

  update(id: number, updatePuzzleDto: UpdatePuzzleDto) {
    return `This action updates a #${id} puzzle`;
  }

  remove(id: number) {
    return `This action removes a #${id} puzzle`;
  }
}
