import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { CollectionsService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Collection } from './entities/collection.entity';
import { ParseArrayIntPipe } from '../common/pipes/parse-array-int.pipe'; // Assuming a custom pipe for array parsing if needed, otherwise use default parsing.
import { IsOptional } from 'class-validator';

// Define a class for query parameters to better organize and validate them
class CollectionQueryDto {
  @IsOptional()
  @IsUUID({}, { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsUUID({}, { each: true })
  themeIds?: string[];

  @IsOptional()
  @IsString()
  search?: string; // For keyword search in name/description
}

@Controller('collections') // Base path for collection API
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(@Body() createCollectionDto: CreateCollectionDto): Promise<Collection> {
    return this.collectionsService.create(createCollectionDto);
  }

  @Get()
  // Use the CollectionQueryDto for structured query parameters
  findAll(
    @Query() query: CollectionQueryDto
  ): Promise<Collection[]> {
    // Pass query parameters to the service
    return this.collectionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Collection> {
    return this.collectionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ): Promise<Collection> {
    return this.collectionsService.update(id, updateCollectionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.collectionsService.remove(id);
  }
}