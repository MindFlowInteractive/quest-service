import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { CreateAnalyticsDto } from './dto/analytics.dto';

const uploadStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads', 'originals');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

@ApiTags('video')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadVideoDto,
  ) {
    if (!file) {
      throw new NotFoundException('No video file provided');
    }

    return this.videoService.createVideo(file, dto);
  }

  @Post(':id/transcode')
  async transcodeVideo(@Param('id') id: string) {
    return this.videoService.transcodeVideoById(id);
  }

  @Get(':id/stream/:resolution')
  async streamVideo(
    @Param('id') id: string,
    @Param('resolution') resolution: string,
    @Res() res: Response,
  ) {
    const stream = await this.videoService.getStreamReference(id, resolution);
    if (!stream || !existsSync(stream.outputFilePath)) {
      throw new NotFoundException('Requested stream is not available');
    }

    const fileStream = createReadStream(stream.outputFilePath);
    res.setHeader('Content-Type', stream.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    fileStream.pipe(res);
  }

  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string) {
    return this.videoService.getAnalytics(id);
  }

  @Post(':id/analytics')
  async recordAnalytics(
    @Param('id') id: string,
    @Body() dto: CreateAnalyticsDto,
  ) {
    return this.videoService.recordAnalyticsEvent(id, dto);
  }

  @Get(':id')
  async getVideo(@Param('id') id: string) {
    return this.videoService.getVideoById(id);
  }

  @Get()
  async listVideos() {
    return this.videoService.listVideos();
  }
}
