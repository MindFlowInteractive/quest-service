import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity({ name: 'puzzle_collection' })
export class PuzzleCollection {
  @PrimaryColumn('uuid')
  puzzle_id: string;

  @PrimaryColumn('uuid')
  collection_id: string;

  @Index()
  @Column({ type: 'int', default: 0 })
  order_index: number;
}
