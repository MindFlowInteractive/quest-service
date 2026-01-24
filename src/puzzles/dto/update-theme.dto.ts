import { PartialType } from '@nestjs/mapped-types';
import { CreateThemeDto } from './create-theme.dto';

export class UpdateThemeDto extends PartialType(CreateThemeDto) {}
