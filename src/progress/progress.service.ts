import { Injectable } from '@nestjs/common';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  create(createProgressDto: CreateProgressDto) {
    return 'This action adds a new progress';
  }

  findAll() {
    return `This action returns all progress`;
  }

  findOne(id: number) {
    return `This action returns a #${id} progress`;
  }

  update(id: number, updateProgressDto: UpdateProgressDto) {
    return `This action updates a #${id} progress`;
  }

  remove(id: number) {
    return `This action removes a #${id} progress`;
  }
}
