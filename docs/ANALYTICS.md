# Product Analytics & Monitoring Documentation

This document describes the integration and configuration of Firebase Analytics and Crashlytics in **Habit Money**, ensuring product telemetry is collected anonymously without compromising the app's offline-first database design or leaking sensitive financial/personally identifiable information (PII).

---

## 1. Installed Dependencies

The following packages have been added to the project:

- **`@react-native-firebase/app`**: Core package to initialize Firebase on mobile platforms.
- **`@react-native-firebase/analytics`**: Collects usage events, user properties, and retention metrics.
- **`@react-native-firebase/crashlytics`**: Tracks, prioritizes, and fixes stability issues in real-time.

---

## 2. Firebase & Android Setup Steps

To set up the native Android configuration:

1. **Google Services Config File**:
   - Download the `google-services.json` from the Firebase Console.
   - Place it in the root of the project (`./google-services.json`) and in the Android app directory (`./android/app/google-services.json`).
   - A placeholder `google-services.json` is checked into the repository to ensure native builds compile correctly out-of-the-box.

2. **Expo Config Plugins (`app.config.js`)**:
   Registered the core and Crashlytics plugins in the `plugins` array:

   ```javascript
   plugins: [
     '@react-native-firebase/app',
     '@react-native-firebase/crashlytics',
     // ...
   ];
   ```

3. **Android Gradle Configuration**:
   - Added classpaths in `android/build.gradle`:
     ```gradle
     dependencies {
         classpath('com.google.gms:google-services:4.4.1')
         classpath('com.google.firebase:firebase-crashlytics-gradle:3.0.7')
     }
     ```
   - Applied plugins in `android/app/build.gradle`:
     ```gradle
     apply plugin: "com.google.gms.google-services"
     apply plugin: "com.google.firebase.crashlytics"
     ```

---

## 3. Product Analytics Service

A centralized, strongly typed service is implemented at [ProductAnalyticsService.ts](file:///home/nmenag/personal-projects/fin-habit/src/services/ProductAnalyticsService.ts) to manage all interactions with Firebase, decoupling the UI/screens from direct native Firebase calls.

### Core Architecture

- **Initialization**: Automatically called on app startup in `App.tsx` via `ProductAnalyticsService.init()`.
- **Global Error Handling**: Unhandled JS errors are automatically captured globally and recorded to Crashlytics via the `ErrorUtils` global handler.
- **Auto Screen Tracking**: Centralized route listener configured on `NavigationContainer` in `App.tsx` logs views automatically as routes change.
- **Zustand Integrations**: Store slices (`accountsSlice.ts`, `transactionsSlice.ts`, `budgetsSlice.ts`, `goalsSlice.ts`) trigger analytic events atomically during write operations.

---

## 4. Available Analytics Events

### Core & Lifecycle Events

- **`app_open`**: Triggered when the application initializes.
- **`app_background`**: Triggered when the app goes into the background.
- **`app_foreground`**: Triggered when the app returns to the foreground.

### Onboarding

- **`first_account_created`**: Triggered when the user creates their first account (accounts list was empty).
- **`first_transaction_created`**: Triggered when the user logs their first transaction (transactions list was empty).

### Transaction Lifecycle

- **`transaction_created`**: Logs when a transaction is added.
  - _Parameters_: `{ transaction_type: 'expense' | 'income' | 'transfer' }`
- **`transaction_updated`**: Logs when a transaction is edited.
  - _Parameters_: `{ transaction_type: 'expense' | 'income' | 'transfer' }`
- **`transaction_deleted`**: Logs when a transaction is deleted.
  - _Parameters_: `{ transaction_type: 'expense' | 'income' | 'transfer' }`

### Account Lifecycle

- **`account_created`**: Logs when a new account is registered.
  - _Parameters_: `{ account_type: string }` (e.g. `cash`, `bank`)
- **`account_updated`**: Logs when an account is updated.
  - _Parameters_: `{ account_type: string }`
- **`account_deleted`**: Logs when an account is deleted.
  - _Parameters_: `{ account_type: string }`

### Budget Lifecycle

- **`budget_created`**: Logs when a new budget is created.
- **`budget_updated`**: Logs when an existing budget is modified.

### Goal Lifecycle

- **`goal_created`**: Logs when a financial goal is created.
- **`goal_updated`**: Logs when a financial goal is modified.

### Insights & Screens

- **`insights_viewed`**: Logs when the user views insights dashboard.
- **`settings_viewed`**: Logs when the user visits settings.

### Screen Navigation

- **`dashboard_viewed`**: Tracks access to the Dashboard screen.
- **`accounts_viewed`**: Tracks access to the Accounts list screen.
- **`transactions_viewed`**: Tracks access to the Transactions screen.
- **`budgets_viewed`**: Tracks access to the Budgets screen.
- **`goals_viewed`**: Tracks access to the Goals screen.
- **`insights_screen_viewed`**: Tracks access to the Insights screen.

---

## 5. Strict Privacy Rules & Filtering

To maintain absolute user trust and financial ledger integrity:

1. **Anonymous Only**: Only usage behavior events and structural metadata (e.g., account type or transaction type) are tracked.
2. **Blocked Parameters**: The following information **is NEVER sent** to Firebase:
   - Transaction amounts or budget limits.
   - Account balances (initial or current).
   - Transaction descriptions, names, or titles.
   - User-entered notes.
   - Category names.
3. **Automatic Sanitizer**: The `ProductAnalyticsService.sanitizeParams` method runs automatically on all parameters, filtering out any keys matching sensitive patterns (`amount`, `balance`, `description`, `note`, `name`, `category`, `title`, etc.) to prevent accidental leaks.

---

## 6. How to Add New Events

1. Open `src/services/ProductAnalyticsService.ts`.
2. Add a new strongly typed method representing the event:
   ```typescript
   public static async logFeatureAction(parameter?: string): Promise<void> {
     await this.logEvent('feature_action', { action_type: parameter });
   }
   ```
3. Trigger the method within the appropriate Zustand store slice or centralized handler (avoid calling it directly inside screen components):
   ```typescript
   ProductAnalyticsService.logFeatureAction('click_tab').catch(() => {});
   ```
4. Verify the event parameters do not violate the privacy guidelines.

---

## 7. Environment & User Differentiation

To separate test activity and developer events from real customer usage in the Firebase console, the service automatically identifies the build environment at startup using the `expo-application` library and sets the following parameters:

### User Properties (Google Analytics)

- **`app_variant`**:
  - `'development'`: Registered during local development runs (`__DEV__ === true`) or when using the `com.habitmoney.dev` package.
  - `'preview'`: Registered when using the `com.habitmoney.preview` package.
  - `'production'`: Registered when using the official production app package `com.finhabit`.
- **`user_type`**:
  - `'internal'`: Used for development and preview build variations.
  - `'real'`: Used for official production runs by external users.

### Crashlytics Custom Keys

The exact same attributes (`app_variant` and `user_type`) are registered as custom attributes in Crashlytics. This allows filtering non-fatal issues and crashes by environment to keep development bugs separate from production crashes.

---

## 8. Enabling Debug Mode (DebugView)

By default, Firebase Analytics batches events locally and uploads them in intervals (about once per hour) to preserve device battery and network bandwidth. To view events in real-time during local development, you must enable **Debug Mode**.

### Android (Emulator or Connected Device)

Run the following command while your device/emulator is active:

```bash
adb shell setprop debug.firebase.analytics.app com.habitmoney.dev
```

To turn off debug mode later:

```bash
adb shell setprop debug.firebase.analytics.app .none.
```

### iOS (Xcode Scheme)

1. Open the native workspace in Xcode (`npx expo run:ios`).
2. Go to **Product > Scheme > Edit Scheme...** from the top menu.
3. Select **Run** in the left sidebar, and click the **Arguments** tab.
4. Under **Arguments Passed On Launch**, add:
   ```text
   -FIRDebugEnabled
   ```
5. Rebuild and run your app.

To turn off debug mode later, remove the launch argument or change it to `-FIRDebugDisabled`.

Once enabled, navigate to **Firebase Console > Analytics > DebugView** to verify that events show up within seconds of their occurrence.
