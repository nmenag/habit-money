import { Dimensions, PixelRatio } from 'react-native';

const baseWidth = 375;

export const scale = (size: number) => {
  const { width } = Dimensions.get('window');
  const factor =
    width >= 600 ? Math.min(width / baseWidth, 1.2) : width / baseWidth;
  return size * factor;
};

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const fontScale = (size: number) => {
  const { width } = Dimensions.get('window');
  const factor =
    width >= 600 ? Math.min(width / baseWidth, 1.15) : width / baseWidth;
  const newSize = size * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const getScreenWidth = () => Dimensions.get('window').width;
export const getScreenHeight = () => Dimensions.get('window').height;

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;
