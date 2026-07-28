import { Transform } from 'class-transformer';
import { TransformationOptions } from 'class-transformer/types/interfaces';

export function Trim(options?: TransformationOptions) {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }, options);
}
