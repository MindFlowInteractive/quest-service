import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('encodings')
export class Encoding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Video, (video) => video.encodings, { onDelete: 'CASCADE' })
  video: Video;

  @Column()
  resolution: string;

  @Column()
  outputFilePath: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  bitrate?: string;

  @CreateDateColumn()
  createdAt: Date;
}
