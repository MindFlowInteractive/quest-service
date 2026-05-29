import { Module } from '@nestjs/common';
import { PuzzleLibraryModule } from './puzzle-library/puzzle-library.module';

@Module({ imports: [PuzzleLibraryModule] })
export class AppModule {}
