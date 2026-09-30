import {
  getAllTimeRange,
  getTodayRange,
  getWeekRange,
  getMonthRange,
  getLastMonthRange,
  getLast30DaysRange,
  getYearRange,
  getRangeForType,
  isInRange,
  getPreviousPeriodRange,
  DateRange,
} from '../dateFilters';

describe('dateFilters', () => {
  describe('getAllTimeRange', () => {
    it('returns 1970 to max date range', () => {
      const range = getAllTimeRange();
      expect(range.type).toBe('allTime');
      expect(range.startDate.getTime()).toBe(0);
      expect(range.endDate.getTime()).toBe(8640000000000000);
    });
  });

  describe('getTodayRange', () => {
    it('returns start and end of today', () => {
      const range = getTodayRange();
      expect(range.type).toBe('today');
      expect(range.startDate.getHours()).toBe(0);
      expect(range.startDate.getMinutes()).toBe(0);
      expect(range.startDate.getSeconds()).toBe(0);
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
      expect(range.endDate.getSeconds()).toBe(59);
      expect(range.endDate.getMilliseconds()).toBe(999);
    });
  });

  describe('getWeekRange', () => {
    it('returns Monday to Sunday week range', () => {
      const range = getWeekRange();
      expect(range.type).toBe('week');
      expect(range.startDate.getHours()).toBe(0);
      expect(range.endDate.getHours()).toBe(23);
      expect(range.endDate.getMinutes()).toBe(59);
    });

    it('handles when current day is Sunday (day === 0)', () => {
      const sundayDate = new Date(2026, 4, 17, 14, 0, 0); // May 17, 2026 is Sunday
      jest.useFakeTimers().setSystemTime(sundayDate);
      const range = getWeekRange();
      expect(range.type).toBe('week');
      expect(range.startDate.getDate()).toBe(11); // Monday May 11
      expect(range.endDate.getDate()).toBe(17); // Sunday May 17
      jest.useRealTimers();
    });
  });

  describe('getMonthRange default params', () => {
    it('uses default cycleStartDay = 1 and default referenceDate when omitted', () => {
      const range = getMonthRange();
      expect(range.type).toBe('month');
      expect(range.startDate.getDate()).toBe(1);
    });

    it('uses default cycleStartDay = 1 in getLastMonthRange when omitted', () => {
      const range = getLastMonthRange();
      expect(range.type).toBe('lastMonth');
    });

    it('uses default cycleStartDay in getRangeForType when omitted and custom when provided', () => {
      const rangeMonth = getRangeForType('month');
      expect(rangeMonth.type).toBe('month');
      const rangeMonthCustom = getRangeForType(
        'month',
        undefined,
        undefined,
        15,
      );
      expect(rangeMonthCustom.type).toBe('month');
      const rangeLastMonth = getRangeForType('lastMonth');
      expect(rangeLastMonth.type).toBe('lastMonth');
      const rangeLastMonthCustom = getRangeForType(
        'lastMonth',
        undefined,
        undefined,
        15,
      );
      expect(rangeLastMonthCustom.type).toBe('lastMonth');
    });
  });

  describe('getMonthRange', () => {
    it('returns calendar month when cycleStartDay is 1', () => {
      const refDate = new Date(2026, 4, 15); // May 15, 2026
      const range = getMonthRange(1, refDate);
      expect(range.type).toBe('month');
      expect(range.startDate.getFullYear()).toBe(2026);
      expect(range.startDate.getMonth()).toBe(4);
      expect(range.startDate.getDate()).toBe(1);
      expect(range.endDate.getDate()).toBe(31);
    });

    it('handles cycleStartDay > 1 when current day is before cycle day', () => {
      const refDate = new Date(2026, 4, 10); // May 10, 2026 < 15
      const range = getMonthRange(15, refDate);
      expect(range.type).toBe('month');
      expect(range.startDate.getMonth()).toBe(3); // April
      expect(range.startDate.getDate()).toBe(15);
      expect(range.endDate.getMonth()).toBe(4); // May
      expect(range.endDate.getDate()).toBe(14);
    });

    it('handles cycleStartDay > 1 when current day is on or after cycle day', () => {
      const refDate = new Date(2026, 4, 20); // May 20, 2026 >= 15
      const range = getMonthRange(15, refDate);
      expect(range.type).toBe('month');
      expect(range.startDate.getMonth()).toBe(4); // May
      expect(range.startDate.getDate()).toBe(15);
      expect(range.endDate.getMonth()).toBe(5); // June
      expect(range.endDate.getDate()).toBe(14);
    });

    it('clamps cycleStartDay exceeding days in month', () => {
      const refDate = new Date(2026, 1, 15); // Feb 15, 2026
      const range = getMonthRange(31, refDate);
      expect(range.type).toBe('month');
    });

    it('clamps cycleStartDay out of bounds (< 1 or > 31)', () => {
      const refDate = new Date(2026, 2, 10);
      const rangeLower = getMonthRange(-5, refDate);
      expect(rangeLower.startDate.getDate()).toBe(1);

      const rangeUpper = getMonthRange(40, refDate);
      expect(rangeUpper.type).toBe('month');
    });
  });

  describe('getLastMonthRange', () => {
    it('returns previous month range for cycleStartDay = 1', () => {
      const refDate = new Date(2026, 4, 15); // May 2026
      const range = getLastMonthRange(1, refDate);
      expect(range.type).toBe('lastMonth');
      expect(range.startDate.getMonth()).toBe(3); // April
      expect(range.startDate.getDate()).toBe(1);
      expect(range.endDate.getDate()).toBe(30);
    });

    it('returns previous month range for cycleStartDay > 1', () => {
      const refDate = new Date(2026, 4, 20); // May 20, 2026
      const range = getLastMonthRange(15, refDate);
      expect(range.type).toBe('lastMonth');
      expect(range.startDate.getMonth()).toBe(3); // April 15
      expect(range.startDate.getDate()).toBe(15);
      expect(range.endDate.getMonth()).toBe(4); // May 14
      expect(range.endDate.getDate()).toBe(14);
    });
  });

  describe('getLast30DaysRange', () => {
    it('returns 30 days prior up to today', () => {
      const range = getLast30DaysRange();
      expect(range.type).toBe('last30Days');
      const diffMs = range.endDate.getTime() - range.startDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(31);
    });
  });

  describe('getYearRange', () => {
    it('returns Jan 1 to Dec 31 of current year', () => {
      const range = getYearRange();
      const now = new Date();
      expect(range.type).toBe('year');
      expect(range.startDate.getFullYear()).toBe(now.getFullYear());
      expect(range.startDate.getMonth()).toBe(0);
      expect(range.startDate.getDate()).toBe(1);
      expect(range.endDate.getMonth()).toBe(11);
      expect(range.endDate.getDate()).toBe(31);
    });
  });

  describe('getRangeForType', () => {
    it('returns corresponding range for all known filter types', () => {
      expect(getRangeForType('allTime').type).toBe('allTime');
      expect(getRangeForType('today').type).toBe('today');
      expect(getRangeForType('week').type).toBe('week');
      expect(getRangeForType('month').type).toBe('month');
      expect(getRangeForType('lastMonth').type).toBe('lastMonth');
      expect(getRangeForType('last30Days').type).toBe('last30Days');
      expect(getRangeForType('year').type).toBe('year');
    });

    it('handles custom range with provided start and end dates', () => {
      const customStart = new Date(2026, 1, 1);
      const customEnd = new Date(2026, 1, 10);
      const range = getRangeForType('custom', customStart, customEnd);
      expect(range.type).toBe('custom');
      expect(range.startDate).toBe(customStart);
      expect(range.endDate).toBe(customEnd);
    });

    it('handles custom range with undefined dates (defaults to today)', () => {
      const range = getRangeForType('custom');
      expect(range.type).toBe('custom');
      expect(range.startDate.getHours()).toBe(0);
      expect(range.endDate.getHours()).toBe(23);
    });

    it('falls back to allTime on unknown type', () => {
      const range = getRangeForType('unknown' as any);
      expect(range.type).toBe('allTime');
    });
  });

  describe('isInRange', () => {
    it('always returns true for allTime range', () => {
      const range = getAllTimeRange();
      expect(isInRange('2026-05-15', range)).toBe(true);
      expect(isInRange('1900-01-01', range)).toBe(true);
    });

    it('returns true when date is within range and false when outside', () => {
      const range: DateRange = {
        type: 'custom',
        startDate: new Date(2026, 4, 1, 0, 0, 0),
        endDate: new Date(2026, 4, 31, 23, 59, 59),
      };

      expect(isInRange('2026-05-15T12:00:00', range)).toBe(true);
      expect(isInRange('2026-05-01T00:00:00', range)).toBe(true);
      expect(isInRange('2026-05-31T23:59:59', range)).toBe(true);
      expect(isInRange('2026-04-30T23:59:59', range)).toBe(false);
      expect(isInRange('2026-06-01T00:00:00', range)).toBe(false);
    });
  });

  describe('getPreviousPeriodRange', () => {
    it('returns null for allTime', () => {
      expect(getPreviousPeriodRange(getAllTimeRange())).toBeNull();
    });

    it('returns prior month cycle for month and lastMonth ranges', () => {
      const monthRange = getMonthRange(1, new Date(2026, 4, 15));
      const prevMonth = getPreviousPeriodRange(monthRange, 1);
      expect(prevMonth).not.toBeNull();
      expect(prevMonth?.startDate.getMonth()).toBe(3); // April

      const lastMonthRange = getLastMonthRange(1, new Date(2026, 4, 15));
      const prevLastMonth = getPreviousPeriodRange(lastMonthRange, 1);
      expect(prevLastMonth).not.toBeNull();
    });

    it('returns prior year for year range', () => {
      const yearRange = getYearRange();
      const prevYear = getPreviousPeriodRange(yearRange);
      expect(prevYear).not.toBeNull();
      expect(prevYear?.startDate.getFullYear()).toBe(
        yearRange.startDate.getFullYear() - 1,
      );
      expect(prevYear?.endDate.getFullYear()).toBe(
        yearRange.endDate.getFullYear() - 1,
      );
    });

    it('returns equivalent duration for custom and rolling ranges', () => {
      const customRange: DateRange = {
        type: 'custom',
        startDate: new Date(2026, 4, 11),
        endDate: new Date(2026, 4, 20),
      };
      const prev = getPreviousPeriodRange(customRange);
      expect(prev).not.toBeNull();
      expect(prev?.type).toBe('custom');
      expect(prev?.endDate.getTime()).toBeLessThan(
        customRange.startDate.getTime(),
      );
    });
  });
});
