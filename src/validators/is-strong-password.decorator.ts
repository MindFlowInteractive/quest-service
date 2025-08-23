import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
          return (
            typeof value === 'string' &&
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a strong password (min 8 chars, upper, lower, number, special)`;
        },
      },
    });
  };
}
