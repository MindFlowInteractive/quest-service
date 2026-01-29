import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthDto } from './create-health.dto';

export class UpdateHealthDto extends PartialType(CreateHealthDto) {}
