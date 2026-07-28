import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageOptionsDto, PageDto, PageMetaDto } from '../../common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<User>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (pageOptionsDto.filter) {
      queryBuilder.where('user.username LIKE :filter', {
        filter: `%${pageOptionsDto.filter}%`,
      });
    }

    if (pageOptionsDto.cursor) {
      const cursorDate = new Date(pageOptionsDto.cursor);
      queryBuilder.andWhere('user.createdAt > :cursor', { cursor: cursorDate });
    }

    if (pageOptionsDto.sort) {
      const [field, order] = pageOptionsDto.sort.split(':');
      queryBuilder.orderBy(`user.${field}`, order as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    queryBuilder.take(pageOptionsDto.limit);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const nextCursor =
      entities.length > 0
        ? entities[entities.length - 1].createdAt.toISOString()
        : null;
    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto,
      nextCursor,
    });

    return new PageDto(entities, pageMetaDto);
  }

  findOne(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.userRepository.softDelete(id);
  }
}
