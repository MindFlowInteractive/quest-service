import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  channelId: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  viewerCount: number;

  @OneToMany(() => Viewer, (viewer) => viewer.channel)
  viewers: Viewer[];

  @OneToMany(() => Stream, (stream) => stream.channel)
  streams: Stream[];
}

@Entity()
export class Stream {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  broadcaster: string;

  @ManyToOne(() => Channel, (channel) => channel.streams, { eager: true })
  channel: Channel;
}

@Entity()
export class Viewer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  viewerId: string;

  @ManyToOne(() => Channel, (channel) => channel.viewers, { eager: true })
  channel: Channel;

  @Column()
  joinedAt: Date;
}

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Channel, { eager: true })
  channel: Channel;

  @Column()
  viewerId: string;

  @Column()
  message: string;

  @Column()
  createdAt: Date;
}
