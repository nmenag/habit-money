# Habit Money 💰📈

Habit Money is a modern, high-performance personal finance tracker built with **React Native** and **Expo**. It empowers users to take control of their financial life through a seamless, localized, and highly organized interface.

<a href="https://play.google.com/store/apps/details?id=com.finhabit">
  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="60">
</a>

## 🌟 Key Features

- **Expo Router Navigation**: Modern, file-based routing architecture for robust deep linking and smooth transitions.
- **First-Launch Onboarding**: Auto-detects system language and currency on first launch, providing a completely localized experience backed by a highly stable, asynchronous prepared SQLite statement validation pipeline to ensure transaction safety during initialization.
- **Dynamic Ledger Grid**: Beautiful standalone contained Material Design 3 cards separating Real Income, Expenses, and Remaining Balance with responsive font sizing, directional icon badges, and dynamic container styling for positive vs. negative cash flows.
- **Dedicated Settings Tab**: A centralized hub for managing Accounts, Categories, Budgets, and Goals, keeping the main dashboard clean and focused.
- **Interactive Reordering**: Full **Drag & Drop** support for Accounts, Categories, Budgets, and Goals, utilizing robust gesture controls (`onLongPress` sort reordering) to ensure vertical list scrolling remains perfectly smooth and free from accidental drag triggers.
- **Category & Account Localizer**: Handled complete locale integration so that editing screens, default category names (e.g. food, rent, entertainment), account types, and input placeholders dynamically translate and initialize in the active language instead of falling back to English.
- **Visual Financial Health**:
  - **Dynamic Dashboard**: Real-time overview of net balance and cash flow, defaulting to the Last 30 Days with dynamic timeline filtering.
  - **Premium Budget Details**: The upgraded `BudgetDetailScreen` replicates the exact high-fidelity credit-card style aggregate ledger of the Accounts detail view, complete with dynamic progress bars, target limits, color-shifting gamified savings insights capsules, and elegant date-grouped transaction aggregation.
  - **Interactive Insights**: Smart analysis of spending growth, savings rates with a dynamic ProgressBar visualizer, frequency alerts, and month-over-month comparisons that intelligently adapt to historical data availability (requires > 60 days of history).
  - **Expense Charts**: Beautiful, responsive pie and bar charts visualizing category-wise spending and month-over-month growth.
  - **Full WCAG Screen Reader Accessibility**: SVG charts, summaries, and metrics now support native `accessible={true}` and custom `accessibilityLabel` parameters for 100% VoiceOver and TalkBack screen-reader coverage.

- **Smart Management**:
  - **Account Tracking**: Manage multiple financial sources (Cash, Bank, Credit).
  - **Financial Goals**: Set targets (e.g., "New Car") and track progress with estimated monthly savings.
  - **Budgeting**: Define monthly spending limits per category with real-time percentage and remaining balance tracking.
- **Customization & UX**:
  - **Expanded Registry & Palette**: Added pre-seeded icons (`home-city` for Rent, `controller-classic` for Entertainment, `format-list-bulleted` for Other) and pre-seeded colors (`#16A34A` for Salary, `#ff4081` for Gifts, `#ff5722` for Bills & Taxes) directly into editing choice grids.
  - **Ergonomic FAB Placement**: List absolute button offsets optimized to hover close to the bottom tab bar (where no banner ads reside to cause overlaps) for comfortable reachability.
  - **Dark Mode Ready**: Sleek, high-contrast layouts utilising themed outline tokens (`theme.colors.outlineVariant`) across all modules (Accounts, Categories, Goals, Transactions) to ensure beautiful visual boundaries under dark mode.
  - **Local Timezone Support**: Accurate financial reporting based on your device's local time, ensuring transactions align with your real-world calendar.
  - **Smart Reminders**: Automated daily and weekly notifications to help you stay consistent with your financial tracking.

- **Data Mobility & Security**:
  - **Export to CSV**: Download full transaction history with date-range filters for external spreadsheet analysis.
  - **JSON Backup & Restore**: Securely export and import all application data to local JSON files for long-term data protection.
- **Compliance & Privacy**:
  - **About the App**: Specialized section for branding, versioning, and developer contact.
  - **Privacy Policy**: Built-in, professional privacy policy compliant with Google Store requirements.
- **Premium Branding & UI**:
  - **High-Resolution Iconography**: Custom, professionally designed app icons for Production and Preview builds.
  - **Android Adaptive Icons**: Full support for adaptive layers (Android 13+ material themed icons).
  - **Android Home Screen Widget**: Dedicated `HabitMoneyWidget` that displays real-time summaries of monthly income/expenses, respects the active system light/dark theme, and includes a deep-link quick action button to open the transaction entry form directly from the home screen.
- **Monetization**: Seamlessly integrated Google Mobile Ads (Banner and Interstitial) with test mode for development.
- **Analytics & Crash Monitoring**: Google Firebase SDK integration (Analytics and Crashlytics) to capture usage trends and improve application stability, utilizing a strict, automated data-sanitization service to ensure no transaction amounts, balances, notes, descriptions, or PII ever leave the device.

## 🛠️ Tech Stack

- **Core**: [Expo SDK 55](https://expo.dev) & React Native 0.83 — [Architecture Details](docs/ARCHITECTURE.md)
- **Telemetry**: [Google Firebase Analytics & Crashlytics](https://firebase.google.com) — [Analytics Details](docs/ANALYTICS.md)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State**: [Zustand v5](https://github.com/pmndrs/zustand) (Sliced & Persisted state)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (High-performance local storage, WAL mode) — [Schema Details](docs/DATABASE_DESIGN.md)
- **UI Components**: [React Native Paper v5](https://reactnativepaper.com/) (Material Design 3)
- **Performance Lists**: [@shopify/flash-list](https://shopify.github.io/flash-list/) (High-performance FlatList replacement)
- **Gestures & Animation**: [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) & [react-native-reanimated v4](https://docs.swmansion.com/react-native-reanimated/)
- **Drag & Drop**: [react-native-draggable-flatlist](https://github.com/computerjazz/react-native-draggable-flatlist)
- **Visualization**: [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
- **Utilities**: `date-fns v4`, `expo-localization`

## 🚀 Getting Started

1. **Clone & Install**

   ```bash
   git clone git@github.com:nmenag/habit-money.git
   cd habit-money
   npm install
   ```

2. **Environment Setup**
   Ensure you have your AdMob IDs configured in `.env` (refer to `app.config.js` for required variables).

3. **Launch Development Server**

   ```bash
   npx expo start
   ```

   Alternatively, you can run the development server via **Docker**:

   ```bash
   docker compose up
   ```

   For detailed setup and network configuration details (such as connecting physical devices over LAN), check the [Docker Guide](docs/DOCKER.md).

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

#### 📳 Home Screen Widget

Habit Money features a native Android home screen widget (`HabitMoneyWidget`).

1. **Native Prebuild Requirements**: Because the widget runs as native `RemoteViews` layouts and requires a background headless task registered in the Android Manifest, you must run a native build to test it:
   ```bash
   npx expo prebuild --platform android --clean
   npx expo run:android
   ```
2. **Dynamic Data Updates**: The widget synchronizes with the app's SQLite database. Changes in transactions dynamically trigger updates via `triggerWidgetUpdate()` within the analytics settings store slice.
3. **Expo Go Fallback**: When testing inside Expo Go or an unlinked dev environment, widget updates will fail gracefully with a console warning instead of crashing the app.

## 🧪 CI/CD

- **GitHub Actions**:
  - **Continuous Integration**: Every Pull Request to `main` triggers a validation pipeline that runs `expo-doctor`, `lint`, and `type-check`.
  - **Automated Releases**: Pushes to `main` trigger a release workflow that automatically creates a GitHub Release tagged with the version from `package.json`.
- **Quality Control**:
  - `npm run doctor`: Validate Expo configuration and dependency health.
  - `npm run lint`: Maintain code quality and style consistency.
  - `npm run lint:commit`: Validate commit messages (required for CI).
  - `npm run check-types`: Ensure full TypeScript type safety.

## ⚙️ Expo & EAS Configuration

This project is configured for **EAS (Expo Application Services)** to handle builds, updates, and distribution.

### `app.config.js`

The application configuration is dynamic and handles three variants: `development`, `preview`, and `production`.

- **Slug**: `habit-money` (Matches the associated EAS Project ID).
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

This project is open-source and licensed under the [MIT License](LICENSE).
