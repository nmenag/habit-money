const getAppVariant = () => {
  return process.env.APP_VARIANT || 'production';
};

const variant = getAppVariant();

const getPackageName = () => {
  if (variant === 'development') return 'com.finhabit.dev';
  if (variant === 'preview') return 'com.finhabit.preview';
  return 'com.finhabit';
};

const getAppName = () => {
  const baseName = 'HabitFin';
  if (variant === 'development') return `${baseName} (Dev)`;
  if (variant === 'preview') return `${baseName} (Preview)`;
  return baseName;
};

const isDev = variant === 'development';

const getIcon = () => {
  if (isDev) return './assets/icon-dev.png';
  return './assets/icon.png';
};

const getAdaptiveForeground = () => {
  if (isDev) return './assets/images/android-icon-foreground-dev.png';
  return './assets/images/android-icon-foreground.png';
};

module.exports = {
  expo: {
    name: getAppName(),
    slug: 'fin-habit',
    version: '1.0.4',
    orientation: 'portrait',
    icon: getIcon(),
    scheme: 'habitfin',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/bed3f721-6ec2-417a-8e38-4d5f66778b4d',
    },
    jsEngine: 'hermes',
    ios: {
      supportsTablet: true,
      bundleIdentifier: getPackageName(),
      jsEngine: 'hermes',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#005CEE',
        foregroundImage: getAdaptiveForeground(),
      },
      // edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: getPackageName(),
      jsEngine: 'hermes',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-sqlite',
      'expo-router',
      'expo-font',
      'expo-image',
      'expo-sharing',
      'expo-web-browser',
      [
        'react-native-google-mobile-ads',
        {
          androidAppId:
            process.env.ADMOB_ANDROID_APP_ID ||
            'ca-app-pub-3940256099942544~3347511713',
          iosAppId:
            process.env.ADMOB_IOS_APP_ID ||
            'ca-app-pub-3940256099942544~1458002511',
        },
      ],
      'expo-build-properties',
      'expo-localization',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#005CEE',
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
    extra: {
      eas: {
        projectId: 'bed3f721-6ec2-417a-8e38-4d5f66778b4d',
      },
    },
  },
};
