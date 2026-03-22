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
  const baseName = 'FinHabit';
  if (variant === 'development') return `${baseName} (Dev)`;
  if (variant === 'preview') return `${baseName} (Preview)`;
  return baseName;
};

const isPreview = variant === 'preview';

module.exports = {
  expo: {
    name: getAppName(),
    slug: 'fin-habit',
    version: '1.0.0',
    orientation: 'portrait',
    icon: isPreview ? './assets/icon-preview.png' : './assets/icon.png',
    scheme: 'finhabit',
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
        foregroundImage: isPreview
          ? './assets/images/android-icon-foreground-preview.png'
          : './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
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
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: 'ca-app-pub-3940256099942544~3347511713',
        },
      ],
      'expo-build-properties',
      'expo-localization',
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
