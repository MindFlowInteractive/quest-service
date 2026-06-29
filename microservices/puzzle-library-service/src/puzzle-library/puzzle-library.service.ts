import { Injectable, NotFoundException } from '@nestjs/common';

export type Difficulty = 'easy' | 'medium' | 'hard';
export interface Puzzle { id: string; title: string; category: string; tags: string[]; difficulty: Difficulty; }

@Injectable()
export class PuzzleLibraryService {
  private readonly puzzles: Puzzle[] = [];

  create(title: string, category: string, difficulty: Difficulty): Puzzle {
    const p: Puzzle = { id: Date.now().toString(), title, category, tags: [], difficulty };
    this.puzzles.push(p);
    return p;
  }

  findAll(category?: string): Puzzle[] {
    return category ? this.puzzles.filter((p) => p.category === category) : [...this.puzzles];
  }

  findById(id: string): Puzzle {
    const p = this.puzzles.find((x) => x.id === id);
    if (!p) throw new NotFoundException(`Puzzle ${id} not found`);
    return p;
  }

  addTag(id: string, tag: string): Puzzle {
    const p = this.findById(id);
    if (!p.tags.includes(tag)) p.tags.push(tag);
    return p;
  }
}
