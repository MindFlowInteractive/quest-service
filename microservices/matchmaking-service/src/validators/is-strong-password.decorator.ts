import { registerDecorator } from 'class-validator';

export function IsStrongPassword(validationOptions?: any) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: any) {
          // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
          return (
            typeof value === 'string' &&
            value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[^A-Za-z0-9]/.test(value)
          );
        },
        defaultMessage(args: any) {
          return `${args.property} must be a strong password (min 8 chars, upper, lower, number, special)`;
        },
      },
    });
  };
}
