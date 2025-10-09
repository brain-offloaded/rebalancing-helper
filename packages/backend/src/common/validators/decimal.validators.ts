import type { DecimalInput } from '@rebalancing-helper/common';
import { createDecimal } from '@rebalancing-helper/common';
import {
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
} from 'class-validator';

function formatProperty(args: ValidationArguments): string {
  return args.property ?? '값';
}

export function IsDecimalValue(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isDecimalValue',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          try {
            createDecimal(value as DecimalInput);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${formatProperty(args)}은(는) Decimal로 변환 가능한 값이어야 합니다.`;
        },
      },
    });
  };
}

export function DecimalMin(
  minimum: DecimalInput,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  const minimumDecimal = createDecimal(minimum);

  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'decimalMin',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [minimumDecimal],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          try {
            const decimal = createDecimal(value as DecimalInput);
            return decimal.greaterThanOrEqualTo(minimumDecimal);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${formatProperty(args)}은(는) ${minimumDecimal.toString()} 이상이어야 합니다.`;
        },
      },
    });
  };
}

export function DecimalPositive(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'decimalPositive',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          try {
            const decimal = createDecimal(value as DecimalInput);
            return decimal.greaterThan(0);
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${formatProperty(args)}은(는) 0보다 커야 합니다.`;
        },
      },
    });
  };
}
