import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { UploadVideoDto } from './dto/upload-video.dto';
import { CreateAnalyticsDto } from './dto/analytics.dto';
import { Encoding } from './entities/encoding.entity';
import { Stream } from './entities/stream.entity';
import { VideoAnalytics } from './entities/video-analytics.entity';
import { Video } from './entities/video.entity';

const RESOLUTION_MAP = {
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
};

@Injectable()
export class VideoService {
  private readonly storagePath = join(process.cwd(), 'uploads');
  private readonly encodedPath = join(this.storagePath, 'encoded');

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @InjectRepository(Encoding)
    private readonly encodingRepository: Repository<Encoding>,
    @InjectRepository(Stream)
    private readonly streamRepository: Repository<Stream>,
    @InjectRepository(VideoAnalytics)
    private readonly analyticsRepository: Repository<VideoAnalytics>,
  ) {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
    if (!existsSync(this.encodedPath)) {
      mkdirSync(this.encodedPath, { recursive: true });
    }
  }

  async createVideo(
    file: Express.Multer.File,
    dto: UploadVideoDto,
  ): Promise<Video> {
    const video = this.videoRepository.create({
      title: dto.title || file.originalname,
      description: dto.description,
      originalFilePath: file.path,
      status: 'uploaded',
    });

    const savedVideo = await this.videoRepository.save(video);
    const analytics = this.analyticsRepository.create({ video: savedVideo });
    await this.analyticsRepository.save(analytics);

    return this.videoRepository.findOne({
      where: { id: savedVideo.id },
      relations: ['analytics', 'encodings', 'streams'],
    });
  }

  async listVideos(): Promise<Video[]> {
    return this.videoRepository.find({
      relations: ['analytics', 'encodings', 'streams'],
    });
  }

  async getVideoById(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({
      where: { id },
      relations: ['analytics', 'encodings', 'streams'],
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return video;
  }

  async transcodeVideoById(id: string): Promise<Encoding[]> {
    const video = await this.getVideoById(id);
    const results: Encoding[] = [];

    for (const resolution of Object.keys(RESOLUTION_MAP)) {
      const outputFilePath = join(
        this.encodedPath,
        `${video.id}_${resolution}.mp4`,
      );
      let encoding = this.encodingRepository.create({
        video,
        resolution,
        outputFilePath,
        status: 'pending',
      });
      encoding = await this.encodingRepository.save(encoding);

      try {
        await this.executeFfmpeg(
          video.originalFilePath,
          outputFilePath,
          resolution,
        );
        encoding.status = 'ready';
        await this.encodingRepository.save(encoding);

        await this.streamRepository.save(
          this.streamRepository.create({
            video,
            resolution,
            outputFilePath,
            accessUrl: `/videos/${video.id}/stream/${resolution}`,
            mimeType: 'video/mp4',
          }),
        );
      } catch (error) {
        encoding.status = 'failed';
        await this.encodingRepository.save(encoding);
      }

      results.push(encoding);
    }

    video.status = 'processed';
    await this.videoRepository.save(video);
    return results;
  }

  async getStreamReference(id: string, resolution: string): Promise<Stream> {
    const video = await this.getVideoById(id);
    const stream = await this.streamRepository.findOne({
      where: { video: { id: video.id }, resolution },
    });
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }
    return stream;
  }

  async getAnalytics(id: string): Promise<VideoAnalytics> {
    const video = await this.getVideoById(id);
    const analytics = await this.analyticsRepository.findOne({
      where: { video: { id: video.id } },
    });
    if (!analytics) {
      throw new NotFoundException('Analytics record not found');
    }
    return analytics;
  }

  async recordAnalyticsEvent(
    id: string,
    dto: CreateAnalyticsDto,
  ): Promise<VideoAnalytics> {
    const analytics = await this.getAnalytics(id);

    switch (dto.event) {
      case 'view':
        analytics.views += 1;
        break;
      case 'playback_start':
        analytics.playbackStarts += 1;
        break;
      case 'watch_time':
        analytics.watchTimeSeconds += dto.watchTimeSeconds ?? 0;
        break;
      default:
        break;
    }

    return this.analyticsRepository.save(analytics);
  }

  private executeFfmpeg(
    input: string,
    output: string,
    resolution: string,
  ): Promise<void> {
    const target = RESOLUTION_MAP[resolution];
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
    const args = [
      '-i',
      input,
      '-vf',
      `scale=w=${target.width}:h=${target.height}:force_original_aspect_ratio=decrease`,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-y',
      output,
    ];

    return new Promise((resolve, reject) => {
      const process = spawn(ffmpeg, args, {
        stdio: ['ignore', 'inherit', 'inherit'],
      });

      process.on('error', (error) => reject(error));
      process.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });
  }
}
