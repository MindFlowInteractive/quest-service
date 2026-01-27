import { registerAs } from "@nestjs/config";

export default registerAs("storage", () => ({
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
  },
  s3: {
    bucket: process.env.S3_BUCKET || "puzzle-storage",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
  cdn: {
    baseUrl: process.env.CDN_BASE_URL || "",
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
    allowedMimeTypes: {
      puzzle: ["image/jpeg", "image/png", "image/webp"],
      avatar: ["image/jpeg", "image/png", "image/webp"],
      asset: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
      other: ["*"],
    },
  },
  optimization: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 85,
  },
  cleanup: {
    delayMs: 24 * 60 * 60 * 1000, // 24 hours
  },
}));
