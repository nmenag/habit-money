import { getLocalISOString, getLocalDateString } from '../dateUtils';

describe('dateUtils', () => {
  describe('getLocalISOString', () => {
    it('formats a provided Date object with correct padding', () => {
      const fixedDate = new Date(2026, 0, 5, 4, 3, 2, 7);
      const result = getLocalISOString(fixedDate);
      expect(result).toBe('2026-01-05T04:03:02.007');
    });

    it('defaults to the current date when no argument is passed', () => {
      const before = new Date().getTime();
      const result = getLocalISOString();
      const after = new Date().getTime();

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/);
      const parsedDate = new Date(result).getTime();
      expect(parsedDate).toBeGreaterThanOrEqual(before - 1000);
      expect(parsedDate).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('getLocalDateString', () => {
    it('formats a provided Date object with correct YYYY-MM-DD format', () => {
      const fixedDate = new Date(2026, 3, 9);
      const result = getLocalDateString(fixedDate);
      expect(result).toBe('2026-04-09');
    });

    it('defaults to current date when no argument is passed', () => {
      const now = new Date();
      const expectedYear = now.getFullYear();
      const result = getLocalDateString();
      expect(result.startsWith(String(expectedYear))).toBe(true);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
