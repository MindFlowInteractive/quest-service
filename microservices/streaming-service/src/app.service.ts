import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel, ChatMessage, Stream, Viewer } from './entities';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Viewer)
    private readonly viewerRepository: Repository<Viewer>,
    @InjectRepository(ChatMessage)
    private readonly chatRepository: Repository<ChatMessage>,
  ) {}

  listStreams() {
    return this.streamRepository.find({ relations: ['channel'] });
  }

  async createStream(title: string, channelId: string, broadcaster: string) {
    let channel = await this.channelRepository.findOne({ where: { channelId } });
    if (!channel) {
      channel = this.channelRepository.create({ channelId, name: `Channel ${channelId}` });
      await this.channelRepository.save(channel);
    }

    const stream = this.streamRepository.create({ title, broadcaster, channel });
    return this.streamRepository.save(stream);
  }

  async joinChannel(channelId: string, viewerId: string) {
    const channel = await this.channelRepository.findOne({ where: { channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    let viewer = await this.viewerRepository.findOne({ where: { viewerId, channel } });
    if (!viewer) {
      viewer = this.viewerRepository.create({ viewerId, channel, joinedAt: new Date() });
      await this.viewerRepository.save(viewer);
    }

    channel.viewerCount = (channel.viewerCount || 0) + 1;
    await this.channelRepository.save(channel);
    return { channelId, viewerId, status: 'joined' };
  }

  async leaveChannel(channelId: string, viewerId: string) {
    const channel = await this.channelRepository.findOne({ where: { channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.viewerRepository.delete({ channel, viewerId });
    channel.viewerCount = Math.max(0, (channel.viewerCount || 1) - 1);
    await this.channelRepository.save(channel);
    return { channelId, viewerId, status: 'left' };
  }

  async postChat(channelId: string, viewerId: string, message: string) {
    const channel = await this.channelRepository.findOne({ where: { channelId } });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const chat = this.chatRepository.create({ channel, viewerId, message, createdAt: new Date() });
    return this.chatRepository.save(chat);
  }
}
