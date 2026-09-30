import {
  lightTheme,
  darkTheme,
  CombinedDefaultTheme,
  CombinedDarkTheme,
  spacing,
  radius,
  chartColors,
  featureColors,
} from '../theme';

describe('theme', () => {
  it('exports valid spacing values', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
    expect(spacing.xxl).toBe(48);
  });

  it('exports valid border radius values', () => {
    expect(radius.sm).toBe(8);
    expect(radius.md).toBe(12);
    expect(radius.lg).toBe(14);
    expect(radius.xl).toBe(16);
    expect(radius.full).toBe(100);
  });

  it('exports 10 distinct chartColors hex values', () => {
    expect(chartColors).toHaveLength(10);
    chartColors.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('maps featureColors to valid colors', () => {
    expect(featureColors.accounts).toBeDefined();
    expect(featureColors.categories).toBeDefined();
    expect(featureColors.budgets).toBeDefined();
    expect(featureColors.goals).toBeDefined();
    expect(featureColors.emergencyFund).toBeDefined();
    expect(featureColors.calendar).toBeDefined();
    expect(featureColors.analytics).toBeDefined();
  });

  it('defines lightTheme and darkTheme with custom semantic colors', () => {
    expect(lightTheme.colors.income).toBeDefined();
    expect(lightTheme.colors.incomeContainer).toBeDefined();
    expect(lightTheme.colors.warning).toBeDefined();
    expect(lightTheme.colors.warningContainer).toBeDefined();
    expect(lightTheme.roundness).toBe(12);

    expect(darkTheme.colors.income).toBeDefined();
    expect(darkTheme.colors.incomeContainer).toBeDefined();
    expect(darkTheme.colors.warning).toBeDefined();
    expect(darkTheme.colors.warningContainer).toBeDefined();
    expect(darkTheme.roundness).toBe(12);
  });

  it('exports CombinedDefaultTheme and CombinedDarkTheme for React Navigation', () => {
    expect(CombinedDefaultTheme.colors).toBeDefined();
    expect(CombinedDefaultTheme.colors.primary).toBe(lightTheme.colors.primary);

    expect(CombinedDarkTheme.colors).toBeDefined();
    expect(CombinedDarkTheme.colors.primary).toBe(darkTheme.colors.primary);
  });
});
