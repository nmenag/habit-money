# FinHabit 💰👋

FinHabit is a modern, high-performance personal finance tracker built with **React Native** and **Expo**. It empowers users to take control of their financial life through a seamless, localized, and highly organized interface.

## 🌟 Key Features

- **Expo Router Navigation**: Modern, file-based routing architecture for robust deep linking and smooth transitions.
- **Dedicated Settings Tab**: A centralized hub for managing Accounts, Categories, Budgets, and Goals, keeping the main dashboard clean and focused.
- **Full Localization (i18n)**: Comprehensive support for English and Spanish, including localized default categories and financial insights.
- **Visual Financial Health**:
  - **Dynamic Dashboard**: Real-time overview of net balance and monthly cash flow.
  - **Interactive Insights**: Smart analysis of spending growth, savings rates, and frequency alerts.
  - **Expense Charts**: Beautiful pie and bar charts visualizing category-wise spending and month-over-month growth.
- **Smart Management**:
  - **Account Tracking**: Manage multiple financial sources (Cash, Bank, Credit).
  - **Financial Goals**: Set targets (e.g., "New Car") and track progress with estimated monthly savings.
  - **Budgeting**: Define monthly spending limits per category with real-time percentage tracking.
- **Accessibility & UX**:
  - **Safe Area Aware**: Optimized for all device sizes (notches, dynamic islands, etc.).
  - **Dark Mode Ready**: Premium look and feel in any lighting.
- **Data Mobility & Security**:
  - **Export to CSV**: Download full transaction history for external spreadsheet analysis.
  - **JSON Backup & Restore**: Securely export and import all application data to local JSON files for long-term data protection.
- **Compliance & Privacy**:
  - **About the App**: Dedicated section for app information, versioning, and developer contact.
  - **Privacy Policy**: Built-in, professional privacy policy compliant with Google Play Store requirements, highlighting local data storage.
- **Monetization**: Seamlessly integrated Google Mobile Ads (Banner and Interstitial) with test mode for development.

## 🛠️ Tech Stack

- **Core**: [Expo SDK](https://expo.dev) & React Native
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State**: [Zustand](https://github.com/pmndrs/zustand) (Atomic & Persisted state)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (High-performance local storage)
- **UI Components**: [React Native Paper](https://reactnativepaper.com/) (Material Design)
- **Visualization**: [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
- **Utilities**: `date-fns`, `expo-localization`

## 🚀 Getting Started

1. **Clone & Install**

   ```bash
   git clone <repo-url>
   cd fin-habit
   npm install
   ```

2. **Environment Setup**
   Ensure you have your AdMob IDs configured in `.env` (refer to `app.config.js` for required variables).

3. **Launch Development Server**
   ```bash
   npx expo start
   ```

## 📦 Deployment & Updates

- **Verified OTA**: Supporting `expo-updates` for seamless Over-The-Air bug fixes and route updates.
- **Build**: Optimized for Android APK/AAB builds using EAS Build.
- **Route Validation**: Run `npm run routes` (aliased to `expo export`) to verify all route files are bundled correctly for OTA updates.

## 📄 License

Private Project. All rights reserved.
