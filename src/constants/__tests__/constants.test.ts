import {
  COLORS,
  CURRENCIES,
  CATEGORY_ICONS,
  GOAL_ICONS,
  getValidCategoryIcon,
  getValidGoalIcon,
} from '../index';

describe('constants', () => {
  it('exports COLORS as a non-empty array of valid color hex codes', () => {
    expect(Array.isArray(COLORS)).toBe(true);
    expect(COLORS.length).toBeGreaterThan(0);
    COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('exports CURRENCIES with valid code, name, symbol, and tKey', () => {
    expect(Array.isArray(CURRENCIES)).toBe(true);
    expect(CURRENCIES.length).toBeGreaterThan(0);
    CURRENCIES.forEach((c) => {
      expect(typeof c.code).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.symbol).toBe('string');
      expect(typeof c.tKey).toBe('string');
    });
  });

  it('exports CATEGORY_ICONS and GOAL_ICONS lists', () => {
    expect(CATEGORY_ICONS).toContain('cash');
    expect(CATEGORY_ICONS).toContain('food');
    expect(GOAL_ICONS).toContain('trophy');
    expect(GOAL_ICONS).toContain('home');
  });

  describe('getValidCategoryIcon', () => {
    it('returns the icon if it exists in CATEGORY_ICONS', () => {
      expect(getValidCategoryIcon('food')).toBe('food');
      expect(getValidCategoryIcon('car')).toBe('car');
    });

    it('returns "tag" fallback for null, undefined, empty, or unknown icons', () => {
      expect(getValidCategoryIcon(null)).toBe('tag');
      expect(getValidCategoryIcon(undefined)).toBe('tag');
      expect(getValidCategoryIcon('')).toBe('tag');
      expect(getValidCategoryIcon('non_existent_icon')).toBe('tag');
    });
  });

  describe('getValidGoalIcon', () => {
    it('returns the icon if it exists in GOAL_ICONS', () => {
      expect(getValidGoalIcon('trophy')).toBe('trophy');
      expect(getValidGoalIcon('airplane')).toBe('airplane');
    });

    it('returns "trophy" fallback for null, undefined, empty, or unknown icons', () => {
      expect(getValidGoalIcon(null)).toBe('trophy');
      expect(getValidGoalIcon(undefined)).toBe('trophy');
      expect(getValidGoalIcon('')).toBe('trophy');
      expect(getValidGoalIcon('non_existent_icon')).toBe('trophy');
    });
  });
});
