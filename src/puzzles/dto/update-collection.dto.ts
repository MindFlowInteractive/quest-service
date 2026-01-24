import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateCollectionDto } from './create-collection.dto';

// Use PartialType to make all fields optional for updates
export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}