import { HttpStatus, HttpException, BadRequestException, NotFoundException as HttpNotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from '../../../src/common/exceptions/http-exception.filter';
import { BaseException } from '../../../src/common/exceptions/base.exception';
import { ValidationException } from '../../../src/common/exceptions/domain.exceptions';
import { ERROR_CODES } from '../../../src/common/exceptions/error-codes';

// Mock the Logger
jest.mock('@nestjs/common', () => {
  const originalModule = jest.requireActual('@nestjs/common');
  return {
    ...originalModule,
    Logger: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
    })),
  };
});

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup mock request
    mockRequest = {
      url: '/api/test',
      method: 'GET',
      headers: {
        'x-request-id': 'test-request-id',
      },
    };

    // Setup mock host
    mockHost = {
      switchToHttp: jest.fn(() => ({
        getResponse: jest.fn(() => mockResponse),
        getRequest: jest.fn(() => mockRequest),
      })),
    };
  });

  describe('BaseException handling', () => {
    it('should handle BaseException correctly', () => {
      const error = new BaseException(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        {
          details: { field: 'email' },
          retryable: true,
          retryAfter: 30,
        },
      );

      filter.catch(error, mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        details: { field: 'email' },
        traceId: 'test-request-id',
        correlationId: 'test-request-id',
        timestamp: expect.any(String),
        path: '/api/test',
        retryable: true,
        retryAfter: 30,
      });
    });

    it('should handle ValidationException with logging', () => {
      const validationErrors = {
        email: ['must be valid email', 'must not be empty'],
        password: ['must be at least 8 characters'],
      };
      
      const error = new ValidationException('Validation failed', validationErrors);

      filter.catch(error, mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with string response', () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(error, mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.NOT_FOUND,
        message: 'The requested resource was not found.',
        errorCode: ERROR_CODES.NOT_FOUND,
        traceId: 'test-request-id',
        correlationId: 'test-request-id',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle HttpException with object response', () => {
      const error = new BadRequestException({
        message: 'Custom validation failed',
        errorCode: 'CUSTOM_VALIDATION_ERROR',
        errors: { field: 'email' },
      });

      filter.catch(error, mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.BAD_REQUEST,
        message: 'Custom validation failed',
        errorCode: 'CUSTOM_VALIDATION_ERROR',
        details: { errors: { field: 'email' } },
        traceId: 'test-request-id',
        correlationId: 'test-request-id',
        timestamp: expect.any(String),
        path: '/api/test',
      });
    });

    it('should handle NotFoundException with user-friendly message', () => {
      const error = new HttpNotFoundException('Custom not found message');

      filter.catch(error, mockHost as any);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'The requested resource was not found.',
          errorCode: ERROR_CODES.NOT_FOUND,
        }),
      );
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');

      filter.catch(error, mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An internal server error occurred.',
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
        traceId: 'test-request-id',
        correlationId: 'test-request-id',
        timestamp: expect.any(String),
        path: '/api/test',
        details: expect.any(Object),
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Development error');

      filter.catch(error, mockHost as any);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.details).toMatchObject({
        error_type: 'Error',
        stack: expect.any(String),
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Production error');

      filter.catch(error, mockHost as any);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Unknown error handling', () => {
    it('should handle unknown error types', () => {
      const error = 'Just a string error';

      filter.catch(error, mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unknown error occurred.',
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
        traceId: 'test-request-id',
        correlationId: 'test-request-id',
        timestamp: expect.any(String),
        path: '/api/test',
        details: expect.any(Object),
      });
    });

    it('should handle null/undefined errors', () => {
      filter.catch(null as any, mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An unknown error occurred.',
          errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
        }),
      );
    });
  });

  describe('Request context handling', () => {
    it('should use correlationId from request if available', () => {
      mockRequest.correlationId = 'custom-correlation-id';
      const error = new Error('Test error');

      filter.catch(error, mockHost as any);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'custom-correlation-id',
        }),
      );
    });

    it('should handle requests without x-request-id header', () => {
      delete mockRequest.headers['x-request-id'];
      const error = new Error('Test error');

      filter.catch(error, mockHost as any);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          traceId: undefined,
          correlationId: undefined,
        }),
      );
    });
  });

  describe('HTTP status code mapping', () => {
    it('should map 400 to BAD_REQUEST error code', () => {
      const error = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.BAD_REQUEST);
    });

    it('should map 401 to UNAUTHORIZED error code', () => {
      const error = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should map 403 to FORBIDDEN error code', () => {
      const error = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.FORBIDDEN);
    });

    it('should map 404 to NOT_FOUND error code', () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.NOT_FOUND);
    });

    it('should map 409 to CONFLICT error code', () => {
      const error = new HttpException('Conflict', HttpStatus.CONFLICT);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.CONFLICT);
    });

    it('should map 422 to VALIDATION_ERROR error code', () => {
      const error = new HttpException('Unprocessable entity', HttpStatus.UNPROCESSABLE_ENTITY);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('should map 429 to RATE_LIMIT_EXCEEDED error code', () => {
      const error = new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
    });

    it('should map 500 to INTERNAL_SERVER_ERROR error code', () => {
      const error = new HttpException('Internal error', HttpStatus.INTERNAL_SERVER_ERROR);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    });

    it('should map 503 to SERVICE_UNAVAILABLE error code', () => {
      const error = new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
      
      filter.catch(error, mockHost as any);
      
      const response = mockResponse.json.mock.calls[0][0];
      expect(response.errorCode).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    });
  });
});