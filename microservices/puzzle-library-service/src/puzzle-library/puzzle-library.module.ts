import { Module } from '@nestjs/common';
import { PuzzleLibraryController } from './puzzle-library.controller';
import { PuzzleLibraryService } from './puzzle-library.service';

@Module({ controllers: [PuzzleLibraryController], providers: [PuzzleLibraryService] })
export class PuzzleLibraryModule {}
