import { PartialType } from '@nestjs/mapped-types';
import { CreateGameLogicDto } from './create-game-logic.dto';

export class UpdateGameLogicDto extends PartialType(CreateGameLogicDto) {}
