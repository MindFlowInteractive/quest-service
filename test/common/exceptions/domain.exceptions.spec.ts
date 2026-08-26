import { HttpStatus } from '@nestjs/common';
import {
  ValidationException,
  NotFoundException,
  ConflictException,
  AuthenticationException,
  AuthorizationException,
  RateLimitException,
  QuestNotFoundException,
  QuestAlreadyCompletedException,
  QuestExpiredException,
  QuestPrerequisiteNotMetException,
  PlayerNotFoundException,
  PlayerInsufficientLevelException,
  PlayerInsufficientResourcesException,
  InvalidOperationException,
  InvalidStateException,
  InsufficientFundsException,
  TimeoutException,
} from '../../../src/common/exceptions/domain.exceptions';
import {
  ERROR_CODES,
  ErrorSeverity,
  ErrorCategory,
} from '../../../src/common/exceptions/error-codes';

describe('Domain Exceptions', () => {
  describe('ValidationException', () => {
    it('should create validation exception with default values', () => {
      const error = new ValidationException('Validation failed');

      expect(error.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.isOperational).toBe(true);
    });

    it('should include validation errors in details', () => {
      const validationErrors = {
        email: ['must be valid email', 'must not be empty'],
        password: ['must be at least 8 characters'],
      };

      const error = new ValidationException(
        'Validation failed',
        validationErrors,
      );

      expect(error.details).toEqual({ errors: validationErrors });
    });
  });

  describe('NotFoundException', () => {
    it('should create not found exception for resource without ID', () => {
      const error = new NotFoundException('User');

      expect(error.errorCode).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.details).toEqual({ resource: 'User', id: undefined });
    });

    it('should create not found exception for resource with ID', () => {
      const error = new NotFoundException('User', '123');

      expect(error.message).toBe('User with ID 123 not found');
      expect(error.details).toEqual({ resource: 'User', id: '123' });
    });

    it('should create not found exception for resource with numeric ID', () => {
      const error = new NotFoundException('Quest', 456);

      expect(error.message).toBe('Quest with ID 456 not found');
      expect(error.details).toEqual({ resource: 'Quest', id: 456 });
    });
  });

  describe('ConflictException', () => {
    it('should create conflict exception', () => {
      const error = new ConflictException('Resource already exists');

      expect(error.errorCode).toBe(ERROR_CODES.CONFLICT);
      expect(error.statusCode).toBe(HttpStatus.CONFLICT);
    });

    it('should include resource details', () => {
      const error = new ConflictException(
        'User already exists',
        'User',
        'email',
      );

      expect(error.details).toEqual({
        resource: 'User',
        conflictingField: 'email',
      });
    });
  });

  describe('AuthenticationException', () => {
    it('should create authentication exception', () => {
      const error = new AuthenticationException('Invalid credentials');

      expect(error.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
    });

    it('should use default message', () => {
      const error = new AuthenticationException();

      expect(error.message).toBe('Authentication required');
    });
  });

  describe('AuthorizationException', () => {
    it('should create authorization exception', () => {
      const error = new AuthorizationException('Insufficient permissions');

      expect(error.errorCode).toBe(ERROR_CODES.FORBIDDEN);
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should include required permission', () => {
      const error = new AuthorizationException(
        'Admin access required',
        'admin:write',
      );

      expect(error.details).toEqual({ requiredPermission: 'admin:write' });
    });
  });

  describe('RateLimitException', () => {
    it('should create rate limit exception', () => {
      const error = new RateLimitException('Too many requests');

      expect(error.errorCode).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(error.retryable).toBe(true);
    });

    it('should include retry after seconds', () => {
      const error = new RateLimitException('Too many requests', 60);

      expect(error.retryAfter).toBe(60);
      expect(error.details).toEqual({ retryAfterSeconds: 60 });
    });
  });

  describe('Quest-specific exceptions', () => {
    it('should create QuestNotFoundException', () => {
      const error = new QuestNotFoundException('quest-123');

      expect(error.errorCode).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.message).toBe('Quest with ID quest-123 not found');
      expect(error.details).toMatchObject({
        id: 'quest-123',
        errorCode: ERROR_CODES.QUEST_NOT_FOUND,
      });
    });

    it('should create QuestAlreadyCompletedException', () => {
      const error = new QuestAlreadyCompletedException(
        'quest-123',
        'player-456',
      );

      expect(error.errorCode).toBe(ERROR_CODES.QUEST_ALREADY_COMPLETED);
      expect(error.message).toBe(
        'Quest quest-123 has already been completed by player player-456',
      );
      expect(error.statusCode).toBe(HttpStatus.CONFLICT);
      expect(error.details).toEqual({
        questId: 'quest-123',
        playerId: 'player-456',
      });
    });

    it('should create QuestExpiredException', () => {
      const expiryDate = new Date('2024-12-31T23:59:59Z');
      const error = new QuestExpiredException('quest-123', expiryDate);

      expect(error.errorCode).toBe(ERROR_CODES.QUEST_EXPIRED);
      expect(error.message).toBe(
        'Quest quest-123 has expired on 2024-12-31T23:59:59.000Z',
      );
      expect(error.statusCode).toBe(HttpStatus.GONE);
      expect(error.details).toEqual({ questId: 'quest-123', expiryDate });
    });

    it('should create QuestPrerequisiteNotMetException', () => {
      const missingPrerequisites = ['quest-1', 'level-10'];
      const error = new QuestPrerequisiteNotMetException(
        'quest-123',
        missingPrerequisites,
        'player-456',
      );

      expect(error.errorCode).toBe(ERROR_CODES.QUEST_PREREQUISITE_NOT_MET);
      expect(error.message).toBe(
        'Player player-456 does not meet prerequisites for quest quest-123',
      );
      expect(error.statusCode).toBe(HttpStatus.PRECONDITION_FAILED);
      expect(error.details).toEqual({
        questId: 'quest-123',
        playerId: 'player-456',
        missingPrerequisites,
      });
    });
  });

  describe('Player-specific exceptions', () => {
    it('should create PlayerNotFoundException', () => {
      const error = new PlayerNotFoundException('player-123');

      expect(error.errorCode).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.message).toBe('Player with ID player-123 not found');
      expect(error.details).toMatchObject({
        id: 'player-123',
        errorCode: ERROR_CODES.PLAYER_NOT_FOUND,
      });
    });

    it('should create PlayerInsufficientLevelException', () => {
      const error = new PlayerInsufficientLevelException('player-123', 20, 15);

      expect(error.errorCode).toBe(ERROR_CODES.PLAYER_INSUFFICIENT_LEVEL);
      expect(error.message).toBe(
        'Player player-123 requires level 20 (current: 15)',
      );
      expect(error.statusCode).toBe(HttpStatus.PRECONDITION_FAILED);
      expect(error.details).toEqual({
        playerId: 'player-123',
        requiredLevel: 20,
        currentLevel: 15,
      });
    });

    it('should create PlayerInsufficientResourcesException', () => {
      const error = new PlayerInsufficientResourcesException(
        'player-123',
        'gold',
        1000,
        500,
      );

      expect(error.errorCode).toBe(ERROR_CODES.PLAYER_INSUFFICIENT_RESOURCES);
      expect(error.message).toBe(
        'Player player-123 requires 1000 gold (current: 500)',
      );
      expect(error.statusCode).toBe(HttpStatus.PRECONDITION_FAILED);
      expect(error.details).toEqual({
        playerId: 'player-123',
        resourceType: 'gold',
        requiredAmount: 1000,
        currentAmount: 500,
      });
    });
  });

  describe('Business logic exceptions', () => {
    it('should create InvalidOperationException', () => {
      const error = new InvalidOperationException(
        'startQuest',
        'quest already in progress',
      );

      expect(error.errorCode).toBe(ERROR_CODES.INVALID_OPERATION);
      expect(error.message).toBe(
        'Operation "startQuest" is invalid: quest already in progress',
      );
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.details).toEqual({
        operation: 'startQuest',
        reason: 'quest already in progress',
      });
    });

    it('should create InvalidStateException without expected state', () => {
      const error = new InvalidStateException('Quest', 'COMPLETED');

      expect(error.errorCode).toBe(ERROR_CODES.INVALID_STATE);
      expect(error.message).toBe('Quest is in invalid state "COMPLETED"');
      expect(error.statusCode).toBe(HttpStatus.CONFLICT);
      expect(error.details).toEqual({
        entity: 'Quest',
        currentState: 'COMPLETED',
        expectedState: undefined,
      });
    });

    it('should create InvalidStateException with expected state', () => {
      const error = new InvalidStateException(
        'Quest',
        'COMPLETED',
        'IN_PROGRESS',
      );

      expect(error.message).toBe(
        'Quest is in state "COMPLETED" but expected "IN_PROGRESS"',
      );
      expect(error.details).toEqual({
        entity: 'Quest',
        currentState: 'COMPLETED',
        expectedState: 'IN_PROGRESS',
      });
    });

    it('should create InsufficientFundsException', () => {
      const error = new InsufficientFundsException(
        'Player wallet',
        1000,
        500,
        'GOLD',
      );

      expect(error.errorCode).toBe(ERROR_CODES.INSUFFICIENT_FUNDS);
      expect(error.message).toBe(
        'Player wallet requires 1000 GOLD (current: 500)',
      );
      expect(error.statusCode).toBe(HttpStatus.PAYMENT_REQUIRED);
      expect(error.details).toEqual({
        entity: 'Player wallet',
        requiredAmount: 1000,
        currentAmount: 500,
        currency: 'GOLD',
      });
    });

    it('should create TimeoutException', () => {
      const error = new TimeoutException('External API call', 5000);

      expect(error.errorCode).toBe(ERROR_CODES.TIMEOUT);
      expect(error.message).toBe(
        'Operation "External API call" timed out after 5000ms',
      );
      expect(error.statusCode).toBe(HttpStatus.GATEWAY_TIMEOUT);
      expect(error.retryable).toBe(true);
      expect(error.details).toEqual({
        operation: 'External API call',
        timeoutMs: 5000,
      });
    });
  });
});
