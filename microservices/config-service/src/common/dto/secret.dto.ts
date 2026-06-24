export class CreateSecretDto {
  name: string;
  value: string;
  description?: string;
  category?: string;
  rotationIntervalSeconds?: number;
}

export class UpdateSecretDto {
  value?: string;
  description?: string;
  isActive?: boolean;
  rotationIntervalSeconds?: number;
}

export class SecretResponseDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  category?: string;
  lastRotatedAt?: Date;
  rotationCount: number;
  requiresRotation: boolean;
  createdAt: Date;
  updatedAt: Date;
}
