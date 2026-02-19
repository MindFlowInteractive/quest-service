/**
 * Puzzle Editor Interfaces
 * Defines core types and contracts for the puzzle editor system
 */

import { PuzzleType, DifficultyLevel } from '../../game-engine/types/puzzle.types';

// ============================================
// Component System
// ============================================

export interface EditorComponent {
  id: string;
  type: ComponentType;
  title: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  properties: Record<string, any>;
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
  metadata: ComponentMetadata;
}

export interface ComponentMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  constraints?: ValidationRule[];
  linkedComponents?: string[];
  description?: string;
  tags?: string[];
  isSuccessState?: boolean;
}

export enum ComponentType {
  // Grid Components
  GRID_CELL = 'GRID_CELL',
  GRID_ROW = 'GRID_ROW',
  GRID_COLUMN = 'GRID_COLUMN',

  // Logic Components
  CONSTRAINT = 'CONSTRAINT',
  RULE = 'RULE',
  CONDITION = 'CONDITION',

  // Sequence Components
  SEQUENCE_ELEMENT = 'SEQUENCE_ELEMENT',
  PATTERN_ELEMENT = 'PATTERN_ELEMENT',

  // Spatial Components
  SPATIAL_OBJECT = 'SPATIAL_OBJECT',
  SPATIAL_OBSTACLE = 'SPATIAL_OBSTACLE',
  SPATIAL_TARGET = 'SPATIAL_TARGET',

  // Interactive Components
  BUTTON = 'BUTTON',
  TEXT_INPUT = 'TEXT_INPUT',
  DROPDOWN = 'DROPDOWN',
  RADIO_GROUP = 'RADIO_GROUP',

  // Display Components
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  HINT_BOX = 'HINT_BOX',
  TIMER = 'TIMER',

  // Container Components
  PANEL = 'PANEL',
  CANVAS = 'CANVAS',
}

export interface ValidationRule {
  id: string;
  type: RuleType;
  condition: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  autoFix?: boolean;
}

export enum RuleType {
  REQUIRED = 'REQUIRED',
  UNIQUE = 'UNIQUE',
  CONSTRAINT = 'CONSTRAINT',
  RANGE = 'RANGE',
  PATTERN = 'PATTERN',
  CUSTOM = 'CUSTOM',
}

// ============================================
// Editor State and Workspace
// ============================================

export interface EditorState {
  id: string;
  components: EditorComponent[];
  connections: ComponentConnection[];
  selectedComponent?: string;
  clipboard?: EditorComponent[];
  history: EditorStateSnapshot[];
  historyIndex: number;
  isDirty: boolean;
  metadata: EditorMetadata;
}

export interface EditorMetadata {
  version: string;
  lastSaved: Date;
  lastModifiedBy: string;
  autosaveEnabled: boolean;
  autosaveInterval: number;
  gridSnap?: boolean;
  gridSize?: number;
}

export interface ComponentConnection {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  connectionType: ConnectionType;
  properties: Record<string, any>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    description?: string;
  };
}

export enum ConnectionType {
  CONSTRAINT = 'CONSTRAINT',
  DATA_FLOW = 'DATA_FLOW',
  TRIGGER = 'TRIGGER',
  REFERENCE = 'REFERENCE',
}

export interface EditorStateSnapshot {
  timestamp: Date;
  state: EditorState;
  description: string;
  author: string;
}

// ============================================
// Drag and Drop
// ============================================

export interface DragDropContext {
  draggedComponent: EditorComponent | null;
  dropTarget: string | null;
  dropPosition: { x: number; y: number } | null;
  isValid: boolean;
  validDropZones: string[];
}

export interface DropZoneConfig {
  componentId: string;
  acceptedTypes: ComponentType[];
  allowMultiple: boolean;
  validateDrop?: (component: EditorComponent, context: any) => boolean;
}

// ============================================
// Validation
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  timestamp: Date;
}

export interface ValidationError {
  id: string;
  componentId?: string;
  message: string;
  severity: 'critical' | 'error';
  line?: number;
  column?: number;
  autoFixable?: boolean;
  autoFix?: () => Promise<void>;
}

export interface ValidationWarning {
  id: string;
  componentId?: string;
  message: string;
  code: string;
  suggestions?: string[];
}

export interface ValidationSuggestion {
  id: string;
  message: string;
  action: () => Promise<void>;
  priority: 'high' | 'medium' | 'low';
}

// ============================================
// Preview and Simulation
// ============================================

export interface PreviewConfig {
  simulationSpeed: number; // 0.5 to 2.0
  autoPlay: boolean;
  showDebugInfo: boolean;
  breakpoints: PreviewBreakpoint[];
  recordReplay: boolean;
}

export interface PreviewBreakpoint {
  id: string;
  componentId: string;
  condition: string;
  enabled: boolean;
  actions: string[];
}

export interface PreviewSession {
  id: string;
  puzzleEditorId: string;
  startTime: Date;
  currentState: any;
  moves: any[];
  breakpointHits: PreviewBreakpoint[];
  performance: PerformanceMetrics;
  recordedReplay: ReplayFrame[];
}

export interface ReplayFrame {
  timestamp: number;
  state: any;
  action: string;
  metadata: Record<string, any>;
}

export interface PerformanceMetrics {
  avgCompletionTime: number;
  minCompletionTime: number;
  maxCompletionTime: number;
  successRate: number;
  averageAttempts: number;
  commonMistakes: string[];
}

// ============================================
// Collaboration and Sharing
// ============================================

export interface CollaborationSession {
  id: string;
  puzzleEditorId: string;
  participants: Collaborator[];
  activeEditors: string[];
  changes: CollaborativeChange[];
  lastModified: Date;
  conflictResolutionStrategy: ConflictStrategy;
}

export interface Collaborator {
  userId: string;
  username: string;
  role: CollaboratorRole;
  joinedAt: Date;
  lastActive: Date;
  cursorPosition?: { x: number; y: number };
  selectedComponent?: string;
  permissions: Permission[];
}

export enum CollaboratorRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
  COMMENTER = 'COMMENTER',
}

export interface Permission {
  action: PermissionAction;
  resourceType: string;
  granted: boolean;
}

export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SHARE = 'SHARE',
  PUBLISH = 'PUBLISH',
  APPROVE = 'APPROVE',
}

export enum ConflictStrategy {
  LAST_WRITE_WINS = 'LAST_WRITE_WINS',
  MERGE = 'MERGE',
  MANUAL_RESOLVE = 'MANUAL_RESOLVE',
  OPERATIONAL_TRANSFORM = 'OPERATIONAL_TRANSFORM',
}

export interface CollaborativeChange {
  id: string;
  userId: string;
  timestamp: Date;
  changeType: ChangeType;
  component: EditorComponent;
  previousValue?: any;
  newValue: any;
  description: string;
}

export enum ChangeType {
  COMPONENT_ADDED = 'COMPONENT_ADDED',
  COMPONENT_MODIFIED = 'COMPONENT_MODIFIED',
  COMPONENT_DELETED = 'COMPONENT_DELETED',
  COMPONENT_MOVED = 'COMPONENT_MOVED',
  CONNECTION_CREATED = 'CONNECTION_CREATED',
  CONNECTION_DELETED = 'CONNECTION_DELETED',
  PROPERTY_CHANGED = 'PROPERTY_CHANGED',
}

// ============================================
// Versioning and History
// ============================================

export interface PuzzleVersion {
  id: string;
  puzzleEditorId: string;
  versionNumber: number;
  versionTag?: string;
  state: EditorState;
  createdBy: string;
  createdAt: Date;
  description?: string;
  isPublished: boolean;
  metadata: VersionMetadata;
}

export interface VersionMetadata {
  changesSummary: string;
  affectedComponents: string[];
  testResults?: TestResult[];
  approvedBy?: string;
  approvedAt?: Date;
  tags: string[];
}

export interface TestResult {
  id: string;
  timestamp: Date;
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
}

// ============================================
// Templates
// ============================================

export interface PuzzleTemplate {
  id: string;
  name: string;
  description: string;
  puzzleType: PuzzleType;
  difficulty: DifficultyLevel;
  category: string;
  baseState: EditorState;
  requiredComponents: ComponentType[];
  suggestedComponents: ComponentType[];
  constraints: TemplateConstraint[];
  examplePuzzles: string[];
  createdBy: string;
  createdAt: Date;
  usageCount: number;
  rating: number;
  tags: string[];
}

export interface TemplateConstraint {
  id: string;
  name: string;
  description: string;
  enforceable: boolean;
  rule: ValidationRule;
}

// ============================================
// Batch Operations
// ============================================

export interface BatchOperation {
  id: string;
  operationType: BatchOperationType;
  targetPuzzles: string[];
  configuration: Record<string, any>;
  status: BatchOperationStatus;
  progress: number;
  startTime: Date;
  estimatedCompletionTime?: Date;
  completionTime?: Date;
  results: BatchOperationResult[];
  errors: BatchOperationError[];
}

export enum BatchOperationType {
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_PUBLISH = 'BULK_PUBLISH',
  BULK_DELETE = 'BULK_DELETE',
  BULK_TAG = 'BULK_TAG',
  BULK_VALIDATE = 'BULK_VALIDATE',
  BULK_TEST = 'BULK_TEST',
  BULK_EXPORT = 'BULK_EXPORT',
}

export enum BatchOperationStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export interface BatchOperationResult {
  puzzleId: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  duration: number;
  data?: any;
}

export interface BatchOperationError {
  puzzleId: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

// ============================================
// Import/Export
// ============================================

export interface ExportFormat {
  format: 'JSON' | 'XML' | 'CSV' | 'YAML' | 'BINARY';
  version: string;
  includeMetadata: boolean;
  includeVersionHistory: boolean;
  includeCollaborators: boolean;
}

export interface ImportOptions {
  format: 'JSON' | 'XML' | 'CSV' | 'YAML' | 'BINARY';
  mergeDuplicates: boolean;
  updateExisting: boolean;
  validateOnImport: boolean;
  autoCreateMissingDependencies: boolean;
}

export interface ExportResult {
  id: string;
  format: string;
  filename: string;
  fileSize: number;
  createdAt: Date;
  createdBy: string;
  downloadUrl: string;
  expiresAt: Date;
}

export interface ImportResult {
  id: string;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  warnings: string[];
  errors: string[];
  importedPuzzleIds: string[];
  createdAt: Date;
  duration: number;
}

// ============================================
// Community and Moderation
// ============================================

export interface CommunitySubmission {
  id: string;
  puzzleEditorId: string;
  submittedBy: string;
  submittedAt: Date;
  status: SubmissionStatus;
  category: string;
  title: string;
  description: string;
  tags: string[];
  metadata: SubmissionMetadata;
  reviews: CommunityReview[];
  votes: {
    upvotes: number;
    downvotes: number;
  };
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FEATURED = 'FEATURED',
  ARCHIVED = 'ARCHIVED',
}

export interface SubmissionMetadata {
  playtestSessions: number;
  avgPlaytestRating: number;
  commonIssues: string[];
  estimatedDifficulty: DifficultyLevel;
  recommendedAgeGroup: string;
  completionRate?: number;
  lastUpdated: Date;
}

export interface CommunityReview {
  id: string;
  submissionId: string;
  reviewedBy: string;
  role: ReviewerRole;
  status: ReviewStatus;
  rating: number;
  feedback: string;
  suggestions: string[];
  checklist: ReviewChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ReviewerRole {
  COMMUNITY_MEMBER = 'COMMUNITY_MEMBER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  GAME_DESIGNER = 'GAME_DESIGNER',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REQUESTED_CHANGES = 'REQUESTED_CHANGES',
  REJECTED = 'REJECTED',
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  category: string;
  checked: boolean;
  notes?: string;
}

// ============================================
// Activity and Monitoring
// ============================================

export interface EditorActivity {
  id: string;
  userId: string;
  puzzleEditorId: string;
  activityType: ActivityType;
  timestamp: Date;
  details: Record<string, any>;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export enum ActivityType {
  COMPONENT_CREATED = 'COMPONENT_CREATED',
  COMPONENT_MODIFIED = 'COMPONENT_MODIFIED',
  COMPONENT_DELETED = 'COMPONENT_DELETED',
  PUZZLE_PUBLISHED = 'PUZZLE_PUBLISHED',
  PUZZLE_TESTED = 'PUZZLE_TESTED',
  COLLABORATION_JOINED = 'COLLABORATION_JOINED',
  COLLABORATION_LEFT = 'COLLABORATION_LEFT',
  VERSION_CREATED = 'VERSION_CREATED',
  SUBMISSION_CREATED = 'SUBMISSION_CREATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}
