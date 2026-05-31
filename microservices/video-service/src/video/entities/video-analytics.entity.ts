import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('video_analytics')
export class VideoAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Video, (video) => video.analytics, { onDelete: 'CASCADE' })
  video: Video;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  playbackStarts: number;

  @Column({ default: 0 })
  watchTimeSeconds: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
