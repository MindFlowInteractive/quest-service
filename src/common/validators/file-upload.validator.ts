
import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
};

export function fileFilter(allowedTypes: string[], allowedMimeTypes?: string[]) {
  return (req: any, file: UploadedFile, callback: Function) => {
    const ext = extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    const extAllowed = allowedTypes.includes(ext);
    const mimeAllowed = allowedMimeTypes ? allowedMimeTypes.includes(mime) : true;
    if (!extAllowed || !mimeAllowed) {
      return callback(
        new BadRequestException(
          `File type not allowed. Allowed extensions: ${allowedTypes.join(', ')}${allowedMimeTypes ? '; allowed MIME types: ' + allowedMimeTypes.join(', ') : ''}`
        ),
        false,
      );
    }
    callback(null, true);
  };
}

export function fileSizeLimit(maxSize: number) {
  return (req: any, file: UploadedFile, callback: Function) => {
    if (file.size > maxSize) {
      return callback(
        new BadRequestException(`File size exceeds ${maxSize} bytes.`),
        false,
      );
    }
    callback(null, true);
  };
}
