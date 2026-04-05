# HabitFin 💰📈

HabitFin is a modern, high-performance personal finance tracker built with **React Native** and **Expo**. It empowers users to take control of their financial life through a seamless, localized, and highly organized interface.

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
  - **UTC Core**: Precise date management using UTC standard for consistent reporting across timezones.
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

- **Core**: [Expo SDK 54](https://expo.dev) & React Native 0.81
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State**: [Zustand](https://github.com/pmndrs/zustand) (Atomic & Persisted state)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (High-performance local storage)
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

## 🧪 CI/CD

- **GitHub Actions**: Automated pipeline for linting and type-checking on every push or pull request to `main`/`master`.
- **Quality Control**: Use `npm run lint` and `npm run check-types` to ensure code stability.

## ⚙️ Expo & EAS Configuration

This project is configured for **EAS (Expo Application Services)** to handle builds, updates, and distribution.

### `app.config.js`

The application configuration is dynamic and handles three variants: `development`, `preview`, and `production`.

- **Slug**: `fin-habit` (Matches the associated EAS Project ID).
- **Name**: `HabitFin`.
- **Scheme**: `habitfin`.

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
  ```

- **Updates**: Push updates to users without a new store submission.
  ```bash
  eas update --branch main --message "Description of changes"
  ```

## 📄 License

Private Project. All rights reserved.
