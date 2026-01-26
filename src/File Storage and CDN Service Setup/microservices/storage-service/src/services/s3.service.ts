import { Injectable, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import storageConfig from "../config/storage.config";

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    @Inject(storageConfig.KEY)
    private config: ConfigType<typeof storageConfig>,
  ) {
    this.s3Client = new S3Client({
      region: this.config.aws.region,
      endpoint: this.config.aws.endpoint,
      credentials: {
        accessKeyId: this.config.aws.accessKeyId,
        secretAccessKey: this.config.aws.secretAccessKey,
      },
      forcePathStyle: this.config.s3.forcePathStyle || true,
    });

    this.bucket = this.config.s3.bucket;
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      }),
    );
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  getBucket(): string {
    return this.bucket;
  }
}
