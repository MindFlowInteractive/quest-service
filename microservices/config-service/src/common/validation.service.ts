import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationService {
  validateConfigKey(key: string): boolean {
    if (!key || key.trim().length === 0) {
      throw new BadRequestException('Configuration key cannot be empty');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      throw new BadRequestException(
        'Configuration key can only contain alphanumeric characters, underscores, and hyphens',
      );
    }

    if (key.length > 255) {
      throw new BadRequestException('Configuration key cannot exceed 255 characters');
    }

    return true;
  }

  validateEnvironmentName(name: string): boolean {
    const validNames = ['development', 'staging', 'production', 'test'];

    if (!validNames.includes(name.toLowerCase())) {
      throw new BadRequestException(`Environment must be one of: ${validNames.join(', ')}`);
    }

    return true;
  }

  validateConfigType(type: 'string' | 'number' | 'boolean' | 'json', value: any): boolean {
    switch (type) {
      case 'number':
        if (isNaN(Number(value))) {
          throw new BadRequestException(`Value must be a valid number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new BadRequestException(`Value must be a boolean (true/false)`);
        }
        break;
      case 'json':
        try {
          JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
        } catch {
          throw new BadRequestException(`Value must be valid JSON`);
        }
        break;
      case 'string':
      default:
        break;
    }

    return true;
  }
}
