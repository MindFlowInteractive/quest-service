import { HttpStatus } from '@nestjs/common';
import {
  BaseException,
  DomainException,
  InfrastructureException,
} from '../../../src/common/exceptions/base.exception';
import {
  ERROR_CODES,
  ErrorSeverity,
  ErrorCategory,
} from '../../../src/common/exceptions/error-codes';

describe('BaseException', () => {
  describe('BaseException class', () => {
    it('should create a BaseException with default values', () => {
      const error = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Test error message',
        HttpStatus.BAD_REQUEST,
      );

      expect(error).toBeInstanceOf(BaseException);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('BaseException');
      expect(error.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.isOperational).toBe(true);
      expect(error.retryable).toBe(false);
      expect(error.details).toBeUndefined();
      expect(error.retryAfter).toBeUndefined();
    });

    it('should create a BaseException with custom options', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const cause = new Error('Original error');

      const error = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Custom error',
        HttpStatus.BAD_REQUEST,
        {
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.VALIDATION,
          details,
          isOperational: false,
          retryable: true,
          retryAfter: 30,
          cause,
        },
      );

      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.details).toEqual(details);
      expect(error.isOperational).toBe(false);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(30);
      expect(error.cause).toBe(cause);
    });

    it('should serialize to JSON correctly', () => {
      const error = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Test error',
        HttpStatus.BAD_REQUEST,
        {
          details: { test: 'data' },
          retryable: true,
          retryAfter: 10,
        },
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'BaseException',
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        message: 'Test error',
        statusCode: HttpStatus.BAD_REQUEST,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { test: 'data' },
        isOperational: true,
        retryable: true,
        retryAfter: 10,
      });
      expect(json.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(json.stack).toBeDefined();
    });

    it('should create HTTP response correctly', () => {
      const error = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Test error',
        HttpStatus.BAD_REQUEST,
        {
          details: { test: 'data' },
          retryable: true,
          retryAfter: 10,
        },
      );

      const httpResponse = error.toHttpResponse('/api/test');

      expect(httpResponse).toEqual({
        code: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        timestamp: error.timestamp.toISOString(),
        path: '/api/test',
        details: { test: 'data' },
        retryable: true,
        retryAfter: 10,
      });
    });

    it('should determine if error should alert', () => {
      const lowSeverityError = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Low',
        HttpStatus.BAD_REQUEST,
        { severity: ErrorSeverity.LOW },
      );

      const mediumSeverityError = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Medium',
        HttpStatus.BAD_REQUEST,
        { severity: ErrorSeverity.MEDIUM },
      );

      const highSeverityError = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'High',
        HttpStatus.BAD_REQUEST,
        { severity: ErrorSeverity.HIGH },
      );

      const criticalSeverityError = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Critical',
        HttpStatus.BAD_REQUEST,
        { severity: ErrorSeverity.CRITICAL },
      );

      expect(lowSeverityError.shouldAlert()).toBe(false);
      expect(mediumSeverityError.shouldAlert()).toBe(false);
      expect(highSeverityError.shouldAlert()).toBe(true);
      expect(criticalSeverityError.shouldAlert()).toBe(true);
    });

    it('should always log errors', () => {
      const error = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Test',
        HttpStatus.BAD_REQUEST,
      );

      expect(error.shouldLog()).toBe(true);
    });
  });

  describe('DomainException class', () => {
    it('should create a DomainException with business logic defaults', () => {
      const error = new DomainException(
        ERROR_CODES.VALIDATION_ERROR,
        'Domain error',
        HttpStatus.BAD_REQUEST,
      );

      expect(error).toBeInstanceOf(DomainException);
      expect(error).toBeInstanceOf(BaseException);
      expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(error.isOperational).toBe(true);
    });

    it('should allow overriding defaults', () => {
      const error = new DomainException(
        ERROR_CODES.VALIDATION_ERROR,
        'Domain error',
        HttpStatus.BAD_REQUEST,
        {
          category: ErrorCategory.VALIDATION,
          isOperational: false,
        },
      );

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('InfrastructureException class', () => {
    it('should create an InfrastructureException with infrastructure defaults', () => {
      const error = new InfrastructureException(
        ERROR_CODES.DATABASE_ERROR,
        'Infrastructure error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      expect(error).toBeInstanceOf(InfrastructureException);
      expect(error).toBeInstanceOf(BaseException);
      expect(error.category).toBe(ErrorCategory.INFRASTRUCTURE);
      expect(error.isOperational).toBe(false);
    });

    it('should allow overriding defaults', () => {
      const error = new InfrastructureException(
        ERROR_CODES.DATABASE_ERROR,
        'Infrastructure error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          category: ErrorCategory.DATABASE,
          isOperational: true,
        },
      );

      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.isOperational).toBe(true);
    });
  });
});
