import { describe, it, expect } from 'vitest';
import { formatDecimal, tryCreateDecimal } from './decimal-format';

describe('decimal-format', () => {
  it('useGrouping 옵션을 사용해 세 자리마다 구분자를 추가한다', () => {
    expect(
      formatDecimal('1234567.89', {
        useGrouping: true,
      }),
    ).toBe('1,234,567.89');
  });

  it('useGrouping이 비활성화되면 원본 문자열을 그대로 반환한다', () => {
    expect(
      formatDecimal('1234567.8900', {
        decimalPlaces: 4,
      }),
    ).toBe('1234567.8900');
  });

  it('음수 값도 세 자리 구분자로 포맷한다', () => {
    expect(
      formatDecimal('-1000000', {
        useGrouping: true,
        decimalPlaces: 0,
      }),
    ).toBe('-1,000,000');
  });

  it('올바르지 않은 입력은 null을 반환한다', () => {
    expect(tryCreateDecimal('invalid-value')).toBeNull();
  });
});
