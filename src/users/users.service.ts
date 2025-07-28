import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a user with id #${id}`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a user with id #${id}`;
  }

  remove(id: string) {
    return `This action removes a user with id #${id}`;
  }
}
