import {
  getGrowthMinThreshold,
  calculateCategoryGrowth,
} from '../categoryGrowth';

describe('categoryGrowth', () => {
  describe('getGrowthMinThreshold', () => {
    it('returns correct threshold for COP by default and explicitly', () => {
      expect(getGrowthMinThreshold()).toBe(20000);
      expect(getGrowthMinThreshold('cop')).toBe(20000);
      expect(getGrowthMinThreshold('COP')).toBe(20000);
    });

    it('returns correct threshold for Latin American currencies', () => {
      expect(getGrowthMinThreshold('CLP')).toBe(5000);
      expect(getGrowthMinThreshold('PYG')).toBe(35000);
      expect(getGrowthMinThreshold('ARS')).toBe(100);
      expect(getGrowthMinThreshold('MXN')).toBe(100);
      expect(getGrowthMinThreshold('PEN')).toBe(20);
      expect(getGrowthMinThreshold('BRL')).toBe(25);
    });

    it('returns 5 for standard international currencies', () => {
      expect(getGrowthMinThreshold('USD')).toBe(5);
      expect(getGrowthMinThreshold('EUR')).toBe(5);
      expect(getGrowthMinThreshold('GBP')).toBe(5);
      expect(getGrowthMinThreshold('CAD')).toBe(5);
      expect(getGrowthMinThreshold('AUD')).toBe(5);
      expect(getGrowthMinThreshold('NZD')).toBe(5);
      expect(getGrowthMinThreshold('CHF')).toBe(5);
      expect(getGrowthMinThreshold('SGD')).toBe(5);
    });

    it('handles default case for unknown currencies', () => {
      expect(getGrowthMinThreshold('XYZ')).toBe(5);
    });
  });

  describe('calculateCategoryGrowth', () => {
    const fixedDate = new Date(2026, 4, 15); // May 15, 2026

    it('returns "new" status when previous spending is 0 and current is positive', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 50000,
        previousMonthTotal: 0,
        referenceDate: fixedDate,
      });

      expect(result.status).toBe('new');
      expect(result.rawGrowthPercentage).toBeNull();
      expect(result.statusLabel).toBe('New');
      expect(result.formattedDisplay).toContain('New');
    });

    it('returns "no_spend" status when current spending is 0 and previous is positive', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 0,
        previousMonthTotal: 50000,
        currencyCode: 'USD',
        language: 'es',
        referenceDate: fixedDate,
      });

      expect(result.status).toBe('no_spend');
      expect(result.rawGrowthPercentage).toBe(-100);
      expect(result.displayGrowthPercentage).toBe(-100);
      expect(result.growthPercentageBadge).toBe('↓100%');
      expect(result.statusLabel).toBe('Sin gastos este mes');
    });

    it('returns "occasional" status when both current and previous spending are below threshold', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 1000,
        previousMonthTotal: 2000,
        currencyCode: 'COP', // min threshold is 20000
        language: 'en',
        referenceDate: fixedDate,
      });

      expect(result.status).toBe('occasional');
      expect(result.rawGrowthPercentage).toBeNull();
      expect(result.statusLabel).toBe('Occasional spend');
    });

    it('falls back to translations.en when unsupported language is passed', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 50000,
        previousMonthTotal: 0,
        language: 'fr' as any,
        referenceDate: fixedDate,
      });
      expect(result.statusLabel).toBe('New');
    });

    it('calculates normal status with > 200% growth capping badge at ↑200%+', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 500000,
        previousMonthTotal: 100000,
        currencyCode: 'COP',
        referenceDate: fixedDate,
      });

      expect(result.status).toBe('normal');
      expect(result.rawGrowthPercentage).toBe(400);
      expect(result.displayGrowthPercentage).toBe(200);
      expect(result.growthPercentageBadge).toBe('↑200%+');
      expect(result.formattedDisplay).toContain('↑200%+');
    });

    it('calculates normal status with positive growth between 0 and 200%', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 150000,
        previousMonthTotal: 100000,
        currencyCode: 'COP',
        referenceDate: fixedDate,
      });

      expect(result.status).toBe('normal');
      expect(result.displayGrowthPercentage).toBe(50);
      expect(result.growthPercentageBadge).toBe('↑50%');
    });

    it('calculates normal status with negative growth', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 60000,
        previousMonthTotal: 100000,
        currencyCode: 'COP',
        referenceDate: fixedDate,
      });

      expect(result.status).toBe('normal');
      expect(result.displayGrowthPercentage).toBe(-40);
      expect(result.growthPercentageBadge).toBe('↓40%');
    });

    it('handles 0% change in normal status (current === previous)', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 100000,
        previousMonthTotal: 100000,
        currencyCode: 'COP',
        referenceDate: fixedDate,
      });

      expect(result.status).toBe('normal');
      expect(result.displayGrowthPercentage).toBe(0);
      expect(result.growthPercentageBadge).toBe('0%');
      expect(result.delta).toBe(0);
    });

    it('works with default parameters (referenceDate omitted)', () => {
      const result = calculateCategoryGrowth({
        currentSpending: 100000,
        previousMonthTotal: 50000,
      });

      expect(result.status).toBe('normal');
      expect(result.displayGrowthPercentage).toBe(100);
    });
  });
});
