import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationErrorException extends HttpException {
  constructor(errors: any, message = 'Validation failed') {
    super(
      {
        message,
        errorCode: 'VALIDATION_ERROR',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Resource not found') {
    super(
      {
        message,
        errorCode: 'NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    super(
      {
        message,
        errorCode: 'UNAUTHORIZED',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(
      {
        message,
        errorCode: 'FORBIDDEN',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
