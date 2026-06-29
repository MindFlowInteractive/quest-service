import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('streams')
export class Stream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Video, (video) => video.streams, { onDelete: 'CASCADE' })
  video: Video;

  @Column()
  resolution: string;

  @Column()
  outputFilePath: string;

  @Column()
  accessUrl: string;

  @Column({ default: 'video/mp4' })
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;
}
