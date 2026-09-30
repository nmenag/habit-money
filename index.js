import { Platform } from 'react-native';

import 'expo-router/entry';

if (Platform.OS === 'android') {
  try {
    const {
      registerWidgetTaskHandler,
    } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (error) {
    console.error('Failed to register widget task handler:', error);
  }
}
