import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on standard iPhone 11/12/13/14/15 width (390px)
// Or use a more conservative 375px (iPhone X/11 Pro/13 mini)
const baseWidth = 375;

export const scale = (size: number) => (SCREEN_WIDTH / baseWidth) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const fontScale = (size: number) => {
  const newSize = (SCREEN_WIDTH / baseWidth) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
