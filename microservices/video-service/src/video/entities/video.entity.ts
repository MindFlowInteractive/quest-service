import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Encoding } from './encoding.entity';
import { Stream } from './stream.entity';
import { VideoAnalytics } from './video-analytics.entity';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  originalFilePath: string;

  @Column({ default: 'uploaded' })
  status: string;

  @OneToMany(() => Encoding, (encoding) => encoding.video, { cascade: true })
  encodings: Encoding[];

  @OneToMany(() => Stream, (stream) => stream.video, { cascade: true })
  streams: Stream[];

  @OneToOne(() => VideoAnalytics, (analytics) => analytics.video, {
    cascade: true,
  })
  @JoinColumn()
  analytics: VideoAnalytics;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
