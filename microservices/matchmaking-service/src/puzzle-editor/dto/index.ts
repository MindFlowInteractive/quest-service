/**
 * Puzzle Editor DTOs
 * Data transfer objects for API requests and responses
 */

import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsEnum,
  IsUUID,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Create/Update DTOs
// ============================================

export class CreatePuzzleEditorDto {
  @IsString()
  @Length(3, 255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isCollaborative?: boolean;
}

export class UpdatePuzzleEditorDto {
  @IsOptional()
  @IsString()
  @Length(3, 255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'IN_PROGRESS', 'TESTING', 'READY_FOR_PUBLICATION', 'PUBLISHED'])
  status?: string;

  @IsOptional()
  @IsArray()
  components?: any[];

  @IsOptional()
  @IsArray()
  connections?: any[];

  @IsOptional()
  @IsObject()
  editorMetadata?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class SaveEditorStateDto {
  @IsArray()
  components: any[];

  @IsArray()
  connections: any[];

  @IsOptional()
  @IsObject()
  editorMetadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  versionTag?: string;
}

export class PublishPuzzleEditorDto {
  @IsString()
  @Length(3, 255)
  title: string;

  @IsString()
  description: string;

  @IsArray()
  tags: string[];

  @IsString()
  category: string;

  @IsString()
  difficulty: string;

  @IsOptional()
  @IsString()
  puzzleType?: string;

  @IsOptional()
  @IsObject()
  scoring?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

// ============================================
// Component DTOs
// ============================================

export class EditorComponentDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsObject()
  position: { x: number; y: number };

  @IsOptional()
  @IsObject()
  size?: { width: number; height: number };

  @IsObject()
  properties: Record<string, any>;

  @IsNumber()
  zIndex: number;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateComponentDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsObject()
  position: { x: number; y: number };

  @IsOptional()
  @IsObject()
  size?: { width: number; height: number };

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  zIndex?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateComponentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  position?: { x: number; y: number };

  @IsOptional()
  @IsObject()
  size?: { width: number; height: number };

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  zIndex?: number;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}

// ============================================
// Collaboration DTOs
// ============================================

export class AddCollaboratorDto {
  @IsUUID()
  userId: string;

  @IsEnum(['OWNER', 'EDITOR', 'VIEWER', 'COMMENTER'])
  role: string;

  @IsOptional()
  @IsArray()
  permissions?: any[];
}

export class RemoveCollaboratorDto {
  @IsUUID()
  userId: string;
}

export class UpdateCollaboratorRoleDto {
  @IsEnum(['OWNER', 'EDITOR', 'VIEWER', 'COMMENTER'])
  role: string;
}

// ============================================
// Validation DTOs
// ============================================

export class ValidatePuzzleDto {
  @IsOptional()
  @IsBoolean()
  autoFix?: boolean;

  @IsOptional()
  @IsArray()
  rulesToCheck?: string[];
}

export class ValidationResultDto {
  @IsBoolean()
  isValid: boolean;

  @IsArray()
  errors: any[];

  @IsArray()
  warnings: any[];

  @IsArray()
  suggestions: any[];

  @IsString()
  timestamp: string;
}

// ============================================
// Preview DTOs
// ============================================

export class StartPreviewSessionDto {
  @IsOptional()
  @IsObject()
  config?: {
    simulationSpeed?: number;
    autoPlay?: boolean;
    showDebugInfo?: boolean;
    recordReplay?: boolean;
  };
}

export class RecordPreviewMoveDto {
  @IsString()
  action: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ============================================
// Template DTOs
// ============================================

export class CreateTemplateDto {
  @IsString()
  @Length(3, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  puzzleType: string;

  @IsString()
  difficulty: string;

  @IsString()
  category: string;

  @IsObject()
  baseState: any;

  @IsOptional()
  @IsArray()
  requiredComponents?: string[];

  @IsOptional()
  @IsArray()
  suggestedComponents?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UseTemplateDto {
  @IsUUID()
  templateId: string;

  @IsString()
  @Length(3, 255)
  newTitle: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// ============================================
// Version Control DTOs
// ============================================

export class CreateVersionDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  versionTag?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RestoreVersionDto {
  @IsUUID()
  versionId: string;

  @IsOptional()
  @IsString()
  description?: string;
}

// ============================================
// Batch Operation DTOs
// ============================================

export class BatchOperationDto {
  @IsEnum(['BULK_UPDATE', 'BULK_PUBLISH', 'BULK_DELETE', 'BULK_TAG', 'BULK_VALIDATE', 'BULK_TEST', 'BULK_EXPORT'])
  operationType: string;

  @IsArray()
  @IsUUID('4', { each: true })
  targetPuzzles: string[];

  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;
}

// ============================================
// Import/Export DTOs
// ============================================

export class ExportPuzzleDto {
  @IsEnum(['JSON', 'XML', 'CSV', 'YAML', 'BINARY'])
  format: string;

  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;

  @IsOptional()
  @IsBoolean()
  includeVersionHistory?: boolean;

  @IsOptional()
  @IsBoolean()
  includeCollaborators?: boolean;
}

export class ImportPuzzleDto {
  @IsEnum(['JSON', 'XML', 'CSV', 'YAML', 'BINARY'])
  format: string;

  @IsString()
  data: string; // Base64 encoded or JSON string

  @IsOptional()
  @IsBoolean()
  mergeDuplicates?: boolean;

  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;

  @IsOptional()
  @IsBoolean()
  validateOnImport?: boolean;
}

// ============================================
// Community Submission DTOs
// ============================================

export class SubmitToCommunityDto {
  @IsString()
  category: string;

  @IsString()
  @Length(3, 255)
  title: string;

  @IsString()
  description: string;

  @IsArray()
  tags: string[];

  @IsOptional()
  @IsString()
  recommendedAgeGroup?: string;
}

export class ReviewSubmissionDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  feedback: string;

  @IsOptional()
  @IsArray()
  suggestions?: string[];

  @IsOptional()
  @IsArray()
  checklist?: any[];

  @IsEnum(['APPROVED', 'REQUESTED_CHANGES', 'REJECTED'])
  status: string;

  @IsOptional()
  @IsString()
  requestedChanges?: string;
}

export class ApproveSubmissionDto {
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class RejectSubmissionDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}

// ============================================
// Search/Filter DTOs
// ============================================

export class SearchPuzzleEditorsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'title', 'rating'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: string;
}

// ============================================
// Response DTOs
// ============================================

export class PuzzleEditorResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsString()
  status: string;

  @IsString()
  createdBy: string;

  @IsArray()
  components: any[];

  @IsArray()
  connections: any[];

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;

  @IsOptional()
  @IsArray()
  collaborators?: any[];

  @IsOptional()
  @IsArray()
  versions?: any[];
}
