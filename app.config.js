const packageJson = require('./package.json');

const getAppVariant = () => {
  return process.env.APP_VARIANT || 'production';
};

const variant = getAppVariant();

const getPackageName = () => {
  if (variant === 'development') return 'com.habitmoney.dev';
  if (variant === 'preview') return 'com.habitmoney.preview';
  return 'com.finhabit';
};

const getAppName = () => {
  const baseName = 'Habit Money';
  if (variant === 'development') return `${baseName} (Dev)`;
  if (variant === 'preview') return `${baseName} (Preview)`;
  return baseName;
};

const getIcon = () => {
  if (variant === 'development') return './assets/images/icon-dev.png';
  if (variant === 'preview') return './assets/images/icon-preview.png';
  return './assets/images/icon.png';
};

const getAdaptiveForeground = () => {
  if (variant === 'development')
    return './assets/images/android-icon-foreground-dev.png';
  return './assets/images/android-icon-foreground.png';
};

module.exports = {
  expo: {
    name: getAppName(),
    slug: 'fin-habit',
    version: packageJson.version,
    orientation: 'portrait',
    icon: getIcon(),
    scheme: 'habitmoney',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    jsEngine: 'hermes',
    ios: {
      supportsTablet: true,
      bundleIdentifier: getPackageName(),
      jsEngine: 'hermes',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#22C55E',
        foregroundImage: getAdaptiveForeground(),
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: getPackageName(),
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || './google-services.json',
      jsEngine: 'hermes',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 300,
          resizeMode: 'contain',
          backgroundColor: '#F8FAFC',
          dark: {
            backgroundColor: '#040908',
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
      [
        'expo-build-properties',
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
      'expo-localization',
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: '#22C55E',
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
