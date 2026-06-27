export class CreateEnvironmentDto {
  name: string;
  displayName: string;
  description?: string;
}

export class UpdateEnvironmentDto {
  displayName?: string;
  description?: string;
  isActive?: boolean;
}

export class EnvironmentResponseDto {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
