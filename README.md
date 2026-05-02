# Habit Money 💰📈

Habit Money is a modern, high-performance personal finance tracker built with **React Native** and **Expo**. It empowers users to take control of their financial life through a seamless, localized, and highly organized interface.

## 🌟 Key Features

- **Expo Router Navigation**: Modern, file-based routing architecture for robust deep linking and smooth transitions.
- **Dedicated Settings Tab**: A centralized hub for managing Accounts, Categories, Budgets, and Goals, keeping the main dashboard clean and focused.
- **Interactive Reordering**: Full **Drag & Drop** support for Accounts, Categories, Budgets, and Goals, allowing for personal organization and layout customization.
- **Full Localization (i18n)**: Comprehensive support for English and Spanish, including localized default categories and financial insights.
- **Visual Financial Health**:
  - **Dynamic Dashboard**: Real-time overview of net balance and monthly cash flow.
  - **Interactive Insights**: Smart analysis of spending growth, savings rates, and frequency alerts.
  - **Expense Charts**: Beautiful pie and bar charts visualizing category-wise spending and month-over-month growth.

- **Smart Management**:
  - **Account Tracking**: Manage multiple financial sources (Cash, Bank, Credit).
  - **Financial Goals**: Set targets (e.g., "New Car") and track progress with estimated monthly savings.
  - **Budgeting**: Define monthly spending limits per category with real-time percentage and remaining balance tracking.
- **Customization & UX**:
  - **Expanded Palette**: Choice of 40+ premium colors and over 100+ specialized icons for categories and goals.
  - **Dark Mode Ready**: Premium look and feel in any lighting.
  - **Local Timezone Support**: Accurate financial reporting based on your device's local time, ensuring transactions align with your real-world calendar.
  - **Smart Reminders**: Automated daily and weekly notifications to help you stay consistent with your financial tracking.

- **Data Mobility & Security**:
  - **Export to CSV**: Download full transaction history for external spreadsheet analysis.
  - **JSON Backup & Restore**: Securely export and import all application data to local JSON files for long-term data protection.
- **Compliance & Privacy**:
  - **About the App**: Specialized section for branding, versioning, and developer contact.
  - **Privacy Policy**: Built-in, professional privacy policy compliant with Google Store requirements.
- **Premium Branding & UI**:
  - **High-Resolution Iconry**: Custom, professionally designed app icons for Production and Preview builds.
  - **Android Adaptive Icons**: Full support for adaptive layers (Android 13+ material themed icons).
- **Monetization**: Seamlessly integrated Google Mobile Ads (Banner and Interstitial) with test mode for development.

## 🛠️ Tech Stack

- **Core**: [Expo SDK 55](https://expo.dev) & React Native 0.83 — [Architecture Details](docs/ARCHITECTURE.md)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State**: [Zustand](https://github.com/pmndrs/zustand) (Atomic & Persisted state)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (High-performance local storage) — [Schema Details](docs/DATABASE_DESIGN.md)
- **UI Components**: [React Native Paper](https://reactnativepaper.com/) (Material Design 3)
- **Gestures**: [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) & [react-native-draggable-flatlist](https://github.com/computerjazz/react-native-draggable-flatlist)
- **Visualization**: [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
- **Utilities**: `date-fns`, `expo-localization`

## 🚀 Getting Started

1. **Clone & Install**

   ```bash
   git clone git@github.com:nmenag/fin-habit.git
   cd fin-habit
   npm install
   ```

2. **Environment Setup**
   Ensure you have your AdMob IDs configured in `.env` (refer to `app.config.js` for required variables).

3. **Launch Development Server**
   ```bash
   npx expo start
   ```

### 📱 Android Development

For local native development on Android, you can run the app directly on your physical device or an emulator.

#### 🛠️ 1. Requirements (Android SDK)

To build and run the native code locally, you must have the **Android SDK** and **Java Development Kit (JDK)** installed:

- **Android Studio**: Install it to get the necessary build tools and SDKs.
- **Environment Variables**: Configure your shell to include `ANDROID_HOME` (e.g., `~/Android/Sdk`) and add the `platform-tools` and `build-tools` directories to your `PATH`.
- **JDK**: Ensure you have a compatible Java version installed (refer to Expo documentation for the specific version required by SDK 55).

#### 🔌 2. Device Setup (USB Debugging)

To run and debug the app on a physical Android device:

1. **Enable Developer Options**: Go to _Settings > About Phone_ and tap **Build Number** 7 times.
2. **Enable USB Debugging**: In _Settings > System > Developer Options_, toggle on **USB Debugging**. This allows the ADB (Android Debug Bridge) to communicate with your device for installing and debugging the application.
3. **Connect**: Plug your device into your computer via a USB cable and authorize the connection on the device screen.

#### 🚀 3. Run the App

With your device connected or an emulator running, execute:

```bash
npx expo run:android
```

This command compiles the native Android project (prebuild) and installs the development build directly onto your device.

#### 🔧 Useful ADB Commands

During development, you may need these common Android Debug Bridge (ADB) commands:

- **List connected devices**: `adb devices`
- **Install an APK**: `adb install path/to/app.apk`
- **Uninstall the app**: `adb uninstall com.habitmoney.dev`
- **Open Dev Menu**: `adb shell input keyevent 82`
- **Forward Metro Port**: `adb reverse tcp:8081 tcp:8081` (Run if the app can't connect to the bundler)
- **View Logs**: `adb logcat` (Filter specifically by `adb logcat *:S ReactNative:V ReactNativeJS:V`)

#### 🧹 Cleaning the Build

If you encounter persistent build errors, you may need to clean the build cache:

```bash
cd android && ./gradlew clean && cd ..
```

#### 🎭 Working with Variants

The app supports different configurations via the `APP_VARIANT` environment variable (defined in `app.config.js`):

- **Development**: `APP_VARIANT=development npx expo run:android` (Package: `com.habitmoney.dev`)
- **Preview**: `APP_VARIANT=preview npx expo run:android` (Package: `com.habitmoney.preview`)
- **Production**: `npx expo run:android` (Package: `com.habitmoney`)

#### 📦 Build APK locally

To generate a standalone APK directly on your machine without using EAS Cloud:

1.  **Navigate to the android directory**:

    ```bash
    cd android
    ```

2.  **Generate a Debug APK**:

    ```bash
    ./gradlew assembleDebug
    ```

    The output will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

3.  **Generate a Release APK**:
    ```bash
    ./gradlew assembleRelease
    ```
    The output will be at: `android/app/build/outputs/apk/release/app-release.apk`
    _Note: Ensure you have your signing config (keystore) properly configured for production builds._

## 🧪 CI/CD

- **GitHub Actions**:
  - **Continuous Integration**: Every Pull Request to `main` triggers a validation pipeline that runs `expo-doctor`, `lint`, and `type-check`.
  - **Automated Releases**: Pushes to `main` trigger a release workflow that automatically creates a GitHub Release tagged with the version from `package.json`.
- **Quality Control**:
  - `npm run doctor`: Validate Expo configuration and dependency health.
  - `npm run lint`: Maintain code quality and style consistency.
  - `npm run check-types`: Ensure full TypeScript type safety.

## ⚙️ Expo & EAS Configuration

This project is configured for **EAS (Expo Application Services)** to handle builds, updates, and distribution.

### `app.config.js`

The application configuration is dynamic and handles three variants: `development`, `preview`, and `production`.

- **Slug**: `fin-habit` (Matches the associated EAS Project ID).
- **Name**: `Habit Money`.
- **Scheme**: `habitmoney`.

### 📦 Deployment & Updates

- **Verified OTA**: Supporting `expo-updates` for seamless Over-The-Air bug fixes and route updates.
- **EAS Build**: Optimized for Android builds across different stages.

  ```bash
  # Production (AAB for Google Play)
  eas build --platform android --profile production

  # Preview (APK for internal testing)
  eas build --platform android --profile preview

  # Development (Development Client for testing native modules)
  eas build --platform android --profile development

  # Development (Development Client for testing native modules) - Local build
   eas build --platform android --profile development --clear-cache --local
  ```

- **Local EAS Builds**: You can also run EAS builds locally on your machine (requires a correctly configured build environment):

  ```bash
  eas build --platform android --profile preview --local
  ```

- **Updates**: Push updates to users without a new store submission.
  ```bash
  eas update --branch main --message "Description of changes"
  ```

## 📄 License

Private Project. All rights reserved.
