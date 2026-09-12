import { Dimensions, PixelRatio } from 'react-native';
import {
  scale,
  moderateScale,
  fontScale,
  getScreenWidth,
  getScreenHeight,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from '../responsive';

describe('responsive utils', () => {
  it('exports valid SCREEN_WIDTH and SCREEN_HEIGHT numbers', () => {
    expect(typeof SCREEN_WIDTH).toBe('number');
    expect(typeof SCREEN_HEIGHT).toBe('number');
    expect(SCREEN_WIDTH).toBeGreaterThan(0);
    expect(SCREEN_HEIGHT).toBeGreaterThan(0);
  });

  describe('phone dimensions (< 600px)', () => {
    beforeEach(() => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 375,
        height: 812,
        scale: 2,
        fontScale: 1,
      });
      jest
        .spyOn(PixelRatio, 'roundToNearestPixel')
        .mockImplementation((val) => Math.round(val));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calculates scale proportionally', () => {
      expect(scale(100)).toBe(100);
    });

    it('calculates moderateScale with default and custom factor', () => {
      expect(moderateScale(100)).toBe(100);
      expect(moderateScale(100, 0.8)).toBe(100);
    });

    it('calculates fontScale', () => {
      expect(fontScale(16)).toBe(16);
    });

    it('returns window dimensions from getters', () => {
      expect(getScreenWidth()).toBe(375);
      expect(getScreenHeight()).toBe(812);
    });
  });

  describe('tablet dimensions (>= 600px)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('caps scale factor at 1.2 on wide tablets (width = 900)', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 900,
        height: 1200,
        scale: 2,
        fontScale: 1,
      });
      jest
        .spyOn(PixelRatio, 'roundToNearestPixel')
        .mockImplementation((val) => Math.round(val));

      // 900 / 375 = 2.4, capped at 1.2
      expect(scale(100)).toBe(120);
      // fontScale: 900 / 375 = 2.4, capped at 1.15 -> 16 * 1.15 = 18.4 -> 18
      expect(fontScale(16)).toBe(18);
    });

    it('uses width / baseWidth when width >= 600 and factor < 1.2 (width = 400)', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({
        width: 410,
        height: 850,
        scale: 2,
        fontScale: 1,
      });
      expect(scale(100)).toBeCloseTo((410 / 375) * 100);
    });
  });
});
