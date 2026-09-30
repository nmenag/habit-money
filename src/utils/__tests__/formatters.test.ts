import { formatNumber, formatCurrency } from '../formatters';

describe('formatters', () => {
  describe('formatNumber', () => {
    it('formats numbers with comma separators in English by default', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(0)).toBe('0');
    });

    it('formats numbers with dot separators in Spanish', () => {
      expect(formatNumber(1234567, 'es')).toBe('1.234.567');
      expect(formatNumber(5000, 'es')).toBe('5.000');
    });

    it('rounds float numbers properly', () => {
      expect(formatNumber(1234.56, 'en')).toBe('1,235');
      expect(formatNumber(1234.4, 'en')).toBe('1,234');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1234567, 'en')).toBe('-1,234,567');
      expect(formatNumber(-1234567, 'es')).toBe('-1.234.567');
    });
  });

  describe('formatCurrency', () => {
    it('formats no-decimal currency COP with default parameters', () => {
      const result = formatCurrency(50000);
      expect(result).toBe('$ 50,000');
    });

    it('formats no-decimal currencies (COP, CLP, PYG, XAF) with correct symbols', () => {
      expect(formatCurrency(15000, 'COP', 'es')).toBe('$ 15.000');
      expect(formatCurrency(25000, 'CLP', 'es')).toBe('$ 25.000');
      expect(formatCurrency(350000, 'PYG', 'es')).toBe('₲ 350.000');
      expect(formatCurrency(45000, 'XAF', 'en')).toBe('FCFA 45,000');
    });

    it('formats decimal currencies with 2 decimal places in English and Spanish', () => {
      expect(formatCurrency(1234.5, 'USD', 'en')).toBe('$ 1,234.50');
      expect(formatCurrency(1234.5, 'EUR', 'es')).toMatch(
        /€\s+(1[.\s]?)?234,50/,
      );
      expect(formatCurrency(99.99, 'GBP', 'en')).toBe('£ 99.99');
      expect(formatCurrency(150.75, 'PEN', 'es')).toMatch(/S\/\s+150,75/);
    });

    it('supports various regional currency codes', () => {
      expect(formatCurrency(100, 'MXN')).toBe('$ 100.00');
      expect(formatCurrency(100, 'CAD')).toBe('$ 100.00');
      expect(formatCurrency(100, 'AUD')).toBe('$ 100.00');
      expect(formatCurrency(100, 'NZD')).toBe('$ 100.00');
      expect(formatCurrency(100, 'ARS')).toBe('$ 100.00');
      expect(formatCurrency(100, 'BOB')).toBe('Bs. 100.00');
      expect(formatCurrency(100, 'CRC')).toBe('₡ 100.00');
      expect(formatCurrency(100, 'CUP')).toBe('$ 100.00');
      expect(formatCurrency(100, 'DOP')).toBe('RD$ 100.00');
      expect(formatCurrency(100, 'GTQ')).toBe('Q 100.00');
      expect(formatCurrency(100, 'HNL')).toBe('L 100.00');
      expect(formatCurrency(100, 'NIO')).toBe('C$ 100.00');
      expect(formatCurrency(100, 'UYU')).toBe('$U 100.00');
      expect(formatCurrency(100, 'VES')).toBe('Bs.S 100.00');
      expect(formatCurrency(100, 'INR')).toBe('₹ 100.00');
      expect(formatCurrency(100, 'ZAR')).toBe('R 100.00');
      expect(formatCurrency(100, 'SGD')).toBe('S$ 100.00');
      expect(formatCurrency(100, 'PHP')).toBe('₱ 100.00');
      expect(formatCurrency(100, 'NGN')).toBe('₦ 100.00');
      expect(formatCurrency(100, 'PKR')).toBe('₨ 100.00');
      expect(formatCurrency(100, 'JMD')).toBe('J$ 100.00');
      expect(formatCurrency(100, 'BSD')).toBe('B$ 100.00');
      expect(formatCurrency(100, 'TTD')).toBe('TT$ 100.00');
      expect(formatCurrency(100, 'BZD')).toBe('BZ$ 100.00');
      expect(formatCurrency(100, 'BBD')).toBe('Bds$ 100.00');
      expect(formatCurrency(100, 'KES')).toBe('KSh 100.00');
      expect(formatCurrency(100, 'GHS')).toBe('₵ 100.00');
    });

    it('falls back to $ symbol for unknown currency code', () => {
      const result = formatCurrency(500, 'UNKNOWN');
      expect(result).toBe('$ 500.00');
    });
  });
});
