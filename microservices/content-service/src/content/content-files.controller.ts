import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
  Headers,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentService } from './content.service.js';
import { StorageService } from '../storage/storage.service.js';

@Controller('content')
export class ContentFilesController {
  constructor(
    private readonly contentService: ContentService,
    private readonly storageService: StorageService,
  ) {}

  @Post(':contentId/files')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-user-id') userId: string,
  ) {
    const content = await this.contentService.findOne(contentId);
    if (content.userId !== userId) {
      throw new ForbiddenException('You can only upload files for your own content');
    }

    return this.storageService.uploadFile(contentId, file.buffer, file.originalname, file.mimetype);
  }

  @Get(':contentId/files')
  async list(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @Headers('x-user-id') userId: string,
  ) {
    const content = await this.contentService.findOne(contentId);
    if (content.userId !== userId) {
      throw new ForbiddenException('You can only list files for your own content');
    }

    return this.storageService.getFilesByContentId(contentId);
  }

  @Get('files/:fileId/signed-url')
  async signedUrl(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Headers('x-user-id') userId: string,
  ) {
    const file = await this.storageService.getFile(fileId);
    const content = await this.contentService.findOne(file.contentId);
    if (content.userId !== userId) {
      throw new ForbiddenException('You can only access signed URLs for your own content files');
    }

    return this.storageService.getSignedUrl(fileId);
  }

  @Delete('files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Headers('x-user-id') userId: string,
  ) {
    const file = await this.storageService.getFile(fileId);
    const content = await this.contentService.findOne(file.contentId);
    if (content.userId !== userId) {
      throw new ForbiddenException('You can only delete your own content files');
    }

    await this.storageService.deleteFile(fileId);
  }
}

