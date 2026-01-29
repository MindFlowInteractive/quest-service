import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "../services/storage.service";
import { UploadFileDto, GetSignedUrlDto, ListFilesDto } from "../dto";

@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body(ValidationPipe) uploadDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const uploadedFile = await this.storageService.uploadFile(file, uploadDto);

    return {
      success: true,
      file: {
        id: uploadedFile.id,
        fileName: uploadedFile.fileName,
        cdnUrl: uploadedFile.cdnUrl,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
        version: uploadedFile.version,
      },
    };
  }

  @Get("files")
  async listFiles(@Query(ValidationPipe) query: ListFilesDto) {
    const result = await this.storageService.listFiles(
      query.userId,
      query.category,
      query.page || 1,
      query.limit || 20,
    );

    return {
      success: true,
      data: result.files,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (query.limit || 20)),
      },
    };
  }

  @Get("files/:id")
  async getFile(@Param("id") id: string, @Query("userId") userId: string) {
    if (!userId) {
      throw new BadRequestException("userId is required");
    }

    const file = await this.storageService.getFile(id, userId);

    return {
      success: true,
      file,
    };
  }

  @Get("files/:id/signed-url")
  async getSignedUrl(
    @Param("id") id: string,
    @Query("userId") userId: string,
    @Query(ValidationPipe) dto: GetSignedUrlDto,
  ) {
    if (!userId) {
      throw new BadRequestException("userId is required");
    }

    const url = await this.storageService.getSignedUrl(
      id,
      userId,
      dto.expiresIn || 3600,
    );

    return {
      success: true,
      url,
      expiresIn: dto.expiresIn || 3600,
    };
  }

  @Delete("files/:id")
  async deleteFile(@Param("id") id: string, @Query("userId") userId: string) {
    if (!userId) {
      throw new BadRequestException("userId is required");
    }

    await this.storageService.deleteFile(id, userId);

    return {
      success: true,
      message: "File deleted successfully",
    };
  }

  @Post("files/:id/version")
  @UseInterceptors(FileInterceptor("file"))
  async createVersion(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query("userId") userId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (!userId) {
      throw new BadRequestException("userId is required");
    }

    const newVersion = await this.storageService.createNewVersion(
      id,
      file,
      userId,
    );

    return {
      success: true,
      file: {
        id: newVersion.id,
        version: newVersion.version,
        previousVersionId: newVersion.previousVersionId,
        cdnUrl: newVersion.cdnUrl,
        size: newVersion.size,
      },
    };
  }
}
