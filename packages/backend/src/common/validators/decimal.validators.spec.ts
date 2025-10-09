import type { ValidationArguments } from 'class-validator';
import { registerDecorator } from 'class-validator';
import {
  DecimalMin,
  DecimalPositive,
  IsDecimalValue,
} from './decimal.validators';

jest.mock('class-validator', () => ({
  registerDecorator: jest.fn(),
}));

const mockedRegisterDecorator = registerDecorator as jest.Mock;

describe('decimal.validators', () => {
  beforeEach(() => {
    mockedRegisterDecorator.mockReset();
  });

  it('IsDecimalValue는 Decimal 변환 가능 여부를 검증한다', () => {
    const target = {};
    IsDecimalValue()(target, 'amount');
    const config = mockedRegisterDecorator.mock.calls[0][0];

    expect(config.name).toBe('isDecimalValue');
    expect(config.validator.validate('123.45')).toBe(true);
    expect(config.validator.validate('abc')).toBe(false);

    const args = { property: 'amount' } as ValidationArguments;
    expect(config.validator.defaultMessage(args)).toContain('amount');
  });

  it('DecimalMin은 최소값 이상인지 확인한다', () => {
    const target = {};
    DecimalMin('10.5')(target, 'amount');
    const config = mockedRegisterDecorator.mock.calls[0][0];

    expect(config.name).toBe('decimalMin');
    expect(config.constraints[0].toString()).toBe('10.5');
    expect(config.validator.validate('11')).toBe(true);
    expect(config.validator.validate('10.4')).toBe(false);

    const message = config.validator.defaultMessage({
      property: 'amount',
    } as ValidationArguments);
    expect(message).toContain('10.5 이상');
  });

  it('DecimalPositive는 0보다 큰 값인지 확인한다', () => {
    const target = {};
    DecimalPositive()(target, 'amount');
    const config = mockedRegisterDecorator.mock.calls[0][0];

    expect(config.name).toBe('decimalPositive');
    expect(config.validator.validate('1')).toBe(true);
    expect(config.validator.validate('0')).toBe(false);
    expect(config.validator.validate('-2')).toBe(false);

    const message = config.validator.defaultMessage({
      property: 'amount',
    } as ValidationArguments);
    expect(message).toContain('0보다 커야 합니다');
  });
});
