import { describe, it, expect } from 'vitest';
import {
  formatCurrencyValue,
  formatQuantityValue,
  formatLastUpdated,
  formatMarketWithSymbol,
} from './formatters';

describe('holdings/formatters', () => {
  describe('formatCurrencyValue', () => {
    it('KRW 통화는 원화 기호와 0자리 소수로 포맷한다', () => {
      expect(formatCurrencyValue('1234567', 'KRW')).toBe('₩1,234,567');
    });

    it('USD 통화는 달러 기호와 2자리 소수로 포맷한다', () => {
      expect(formatCurrencyValue('1234.5', 'USD')).toBe('$1,234.50');
    });

    it('기타 통화는 통화 코드를 접두사로 포함한다', () => {
      expect(formatCurrencyValue('9876.543', 'JPY')).toBe('JPY 9,876.54');
    });

    it('잘못된 값은 하이픈을 반환한다', () => {
      expect(formatCurrencyValue('not-a-number', 'USD')).toBe('-');
    });
  });

  describe('formatQuantityValue', () => {
    it('수량을 세 자리 구분자와 함께 표시한다', () => {
      expect(formatQuantityValue('10000.500')).toBe('10,000.5');
    });

    it('잘못된 값은 하이픈을 반환한다', () => {
      expect(formatQuantityValue('invalid')).toBe('-');
    });
  });

  describe('formatLastUpdated', () => {
    it('유효한 날짜는 YYYY-MM-DD HH:mm 형식으로 반환한다', () => {
      expect(formatLastUpdated('2024-05-01T12:34:56')).toBe('2024-05-01 12:34');
    });

    it('빈 값이나 잘못된 값은 하이픈을 반환한다', () => {
      expect(formatLastUpdated('')).toBe('-');
      expect(formatLastUpdated('invalid-date')).toBe('-');
    });
  });

  describe('formatMarketWithSymbol', () => {
    it('시장 코드와 심볼을 함께 표시한다', () => {
      expect(formatMarketWithSymbol('NASDAQ', 'AAPL')).toBe('NASDAQ · AAPL');
    });

    it('시장 정보가 없으면 심볼만 반환한다', () => {
      expect(formatMarketWithSymbol(null, 'TSLA')).toBe('TSLA');
      expect(formatMarketWithSymbol('   ', 'TSLA')).toBe('TSLA');
    });
  });
});
