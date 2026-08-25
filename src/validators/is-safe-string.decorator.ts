import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          const unsafeChars = /[<>&"'/]/;
          return !unsafeChars.test(value);
        },
        defaultMessage(args) {
          return `${args.property} contains unsafe characters.`;
        },
      },
    });
  };
}
