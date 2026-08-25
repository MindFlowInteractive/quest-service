import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, ValidationPipe, ValidationError } from '@nestjs/common';
import { ValidationException } from './domain.exceptions';

function formatErrors(errors: ValidationError[]): any[] {
  return errors.map(err => {
    return {
      property: err.property,
      constraints: err.constraints,
      children: err.children && err.children.length > 0 ? formatErrors(err.children) : undefined,
    };
  });
}

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) => {
        const validationErrors = errors.reduce((acc, err) => {
          acc[err.property] = Object.values(err.constraints || {});
          return acc;
        }, {} as Record<string, string[]>);
        
        return new ValidationException('Validation failed', validationErrors);
      },
    });
  }
}
