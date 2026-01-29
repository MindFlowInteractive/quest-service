import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, ValidationPipe, ValidationError } from '@nestjs/common';
import { ValidationErrorException } from './custom-exceptions';

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
        return new ValidationErrorException(formatErrors(errors));
      },
    });
  }
}
