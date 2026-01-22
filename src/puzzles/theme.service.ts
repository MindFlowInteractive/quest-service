import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Theme } from './entities/theme.entity';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { Collection } from './entities/collection.entity'; // Import Collection entity

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(Theme)
    private themesRepository: Repository<Theme>,
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
  ) {}

  async create(createThemeDto: CreateThemeDto): Promise<Theme> {
    const { collectionIds, ...themeData } = createThemeDto;

    const theme = this.themesRepository.create(themeData);

    // Associate collections
    if (collectionIds && collectionIds.length > 0) {
      const collections = await this.collectionsRepository.findBy({ id: In(collectionIds) });
      if (collections.length !== collectionIds.length) {
        throw new BadRequestException('One or more collection IDs not found.');
      }
      theme.collections = collections;
    }

    return this.themesRepository.save(theme);
  }

  async findAll(): Promise<Theme[]> {
    return this.themesRepository.find({
      relations: ['collections'], // Include collections for detailed view
    });
  }

  async findOne(id: string): Promise<Theme> {
    const theme = await this.themesRepository.findOne({
      where: { id },
      relations: ['collections'], // Include collections for detailed view
    });
    if (!theme) {
      throw new NotFoundException(`Theme with ID "${id}" not found`);
    }
    return theme;
  }

  async update(id: string, updateThemeDto: UpdateThemeDto): Promise<Theme> {
    const theme = await this.findOne(id);
    const { collectionIds, ...themeData } = updateThemeDto;

    Object.assign(theme, themeData);

    // Re-associate collections if provided
    if (collectionIds !== undefined) {
      if (collectionIds.length > 0) {
        const collections = await this.collectionsRepository.findBy({ id: In(collectionIds) });
        if (collections.length !== collectionIds.length) {
          throw new BadRequestException('One or more collection IDs not found.');
        }
        theme.collections = collections;
      } else {
        theme.collections = []; // Clear collections if an empty array is provided
      }
    }

    return this.themesRepository.save(theme);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Ensure theme exists
    const result = await this.themesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Theme with ID "${id}" not found`);
    }
  }

  // Optional: Methods to manage theme-collection relationships directly
  // async addCollection(themeId: string, collectionId: string): Promise<Theme> {
  //   const theme = await this.findOne(themeId);
  //   const collection = await this.collectionsRepository.findOneByOrFail({ id: collectionId });
  //   theme.collections.push(collection);
  //   return this.themesRepository.save(theme);
  // }

  // async removeCollection(themeId: string, collectionId: string): Promise<Theme> {
  //   const theme = await this.findOne(themeId);
  //   theme.collections = theme.collections.filter(col => col.id !== collectionId);
  //   return this.themesRepository.save(theme);
  // }
}
