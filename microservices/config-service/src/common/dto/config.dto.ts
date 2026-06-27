export class CreateConfigDto {
  key: string;
  value: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  isSecret?: boolean;
  category?: string;
  tags?: string;
  environmentId?: string;
}

export class UpdateConfigDto {
  value?: string;
  description?: string;
  isActive?: boolean;
  category?: string;
  tags?: string;
}

export class ConfigResponseDto {
  id: string;
  key: string;
  value: string;
  description?: string;
  type: string;
  isSecret: boolean;
  isActive: boolean;
  category?: string;
  tags?: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
}
