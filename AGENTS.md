# Habit Money - AI Agent Rules & Guidelines

This document serves as the absolute source of truth for all AI agents (including Claude Code, Cursor, Gemini, Windsurf, and Copilot Agent) working within the **Habit Money** (also known as `habit-money`) repository.

Always cross-reference this file and the design guidelines in `DESIGN.md` before making any code modifications.

---

## 1. Project Overview

- **Domain**: Habit Money is a mobile-first, offline-first personal finance tracker built using **React Native + Expo** and **TypeScript**.
- **Key Goal**: Empower users to track transactions, manage budgets, track savings goals, and understand their financial habits with absolute speed and reliability.
- **Architecture Style**: Offline-first. Local SQLite is the sole source of truth for database records. Zustand is used to manage in-memory global state, keep UI components in sync with the SQLite database, and handle language translations.
- **Core Philosophy**: Extreme simplicity and reliability. Cold starts, page transitions, and calculations must feel instantaneous. Visual hierarchy must feel professional, clean, and trustworthy (resembling premium interfaces like Stripe or Wise).

---

## 2. Architecture

- **Strict TypeScript**: TypeScript strict mode is enabled.
  - Do not use `any`. Always declare explicit types.
  - Explicit return types must be declared for all exported helper functions, custom hooks, and store slices.
- **Separation of Concerns**: Keep UI components purely representational and presentation-focused. Place all database interaction, state mutations, and heavy computation in store slices or dedicated services.
- **Layer Responsibilities**:
  - **Database Layer (`src/db/schema.ts`)**: Initializes tables, handles migrations, and provides SQLite database connection handles.
  - **Zustand Slices (`src/store/slices/*`)**: Encapsulates state logic and acts as the Repository layer. All write/read operations to SQLite must happen synchronously or asynchronously inside store slices to ensure in-memory state and disk database remain fully in sync.
  - **Services Layer (`src/features/*/services/*`)**: Houses calculations and algorithms (e.g., `AnalyticsManager`, `AnalyticsService`, `InsightEngine`) to keep the stores thin and components decoupled.
  - **UI Components & Hooks**: Components use `useStore` selectors to read state, and translation helpers like `useTranslation` to render copy.
- **Component Design**: Components must never directly invoke `getDb()` or run SQL statements. They must interact only with state stores and custom hooks.

---

## 3. Financial Domain Rules

- **Money Calculations**:
  - Avoid JavaScript floating-point inaccuracies. Perform calculations carefully when doing addition, subtraction, or aggregation.
  - Store money values in the SQLite database as `REAL NOT NULL`.
  - For UI representation, always format financial values using the store's `formatCurrency(amount, currencyCode)` helper, which automatically honors the selected currency (defaulting to `COP`) and user language.
- **Account Balances**:
  - Account balances have an `initialBalance` and a `currentBalance`.
  - The `currentBalance` must represent the `initialBalance` plus the net sum of all associated transactions (income increases the balance, expense decreases it).
  - Manual overrides to an account balance must be recorded as a balance adjustment transaction with a specific note (`Balance Adjustment` or `Ajuste de Saldo`) to preserve transaction ledger integrity.
- **Transfers**:
  - Double-entry integrity: A transfer transaction must update both the source account (`accountId`) and destination account (`toAccountId`) balance simultaneously.
  - When a transfer is added, edited, or deleted, ensure both account balances are adjusted transactionally inside the store slice.
- **Budgets**:
  - Budgets map directly to specific expense categories via `categoryId`.
  - Budget adherence is calculated by matching the budget's monthly target `amount` against the sum of expenses belonging to that category within the selected date range.
- **Goals**:
  - A goal consists of a `targetAmount`, `currentAmount`, `deadline`, and `status` ('active' or completed).
  - When transactions are made towards goals, or goal progress changes, updates must ensure proper numeric bounds checking (e.g., progress cannot be negative, and status must update to reflect completion).
- **Data Consistency**:
  - All transaction and goal dates must be stored as ISO 8601 strings in local time (`YYYY-MM-DDTHH:mm:ss.SSS`) using format helpers in `src/utils/dateUtils.ts`.
  - Any insert, delete, or update operation must update both the SQLite database on disk and the corresponding Zustand state atomically.
- **Validation Requirements**:
  - Transactions must enforce `amount > 0`.
  - Transaction category and accounts must exist in the database before saving.

---

## 4. Dashboard Rules

- **Quick Overview**: The dashboard is a high-level summary. It must load instantly and remain uncluttered.
- **Current Balances**: Accounts listed on the dashboard must always show their current balances as calculated in the ledger.
- **Dashboard Specific Ranges**:
  - **Overview Cards & Metrics** (Income, Expenses, Net Flow) must use a fixed **Last 30 Days** range, relative to the current local time.
  - **Monthly Spending Progress** must use the **Current Month** (from the 1st of the current month to the last day of the current month).
- **Isolation of Filters**: The Dashboard must **never** be affected by filters chosen on the Transactions or Insights screens. Slices must manage a separate, static `dashboardReport` query state that remains independent of user-selected filters.

---

## 5. Insights Rules

- **Advanced Reporting**: The Insights section is dedicated to complex data analysis, trends, and growth indicators.
- **Date Filtering**: Honors user choices dynamically from `useFilterStore.getState().selectedRange`.
- **Historical Comparisons**:
  - Insight metrics must compare the selected period with the previous period of equivalent duration (e.g., comparing the current month to the prior calendar month using `getPreviousPeriodRange(range)`).
- **Handling Insufficient Data**:
  - If the database contains less than 60 days of transactional history (determined by finding the oldest transaction date), display friendly fallback messages, guides on how to add more transactions, or omit trend visualizations to avoid skewing predictions.

---

## 6. Database Rules

- **SQLite Best Practices**:
  - The database is stored locally as `finhabit.db` using `expo-sqlite`.
  - SQLite pragmas must be initialized on start: WAL journal mode (`PRAGMA journal_mode = WAL`), normal sync (`PRAGMA synchronous = NORMAL`), and in-memory temporary store (`PRAGMA temp_store = MEMORY`) to maximize performance.
  - Read/Write commands: Use synchronous APIs (`runSync`, `getAllSync`, `getFirstSync`) inside Zustand store initialization and state modification slices to guarantee transactional completeness before updating memory. Use asynchronous database APIs (`getAllAsync`, `getFirstAsync`) for heavy background reporting services (like `AnalyticsService`) to prevent blocking the UI thread.
- **Repository Pattern**: All database interactions are scoped to store slices (`src/store/slices/*`). Raw SQLite queries must not be written inside components.
- **Migrations**: Changes to the SQLite schema must be added safely in `src/db/schema.ts` inside the `initDb()` function using `try/catch` and safe constraints (`IF NOT EXISTS`, `ALTER TABLE` checks).
- **Transactions**: Multi-table updates (e.g., adding a transaction and updating the account's balance) must occur atomically inside the database.
- **Data Integrity**: Enforce foreign keys on delete. E.g., transaction categories should cascade set null: `FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL`. Maintain indexes on frequently sorted columns (`date`, `accountId`, `categoryId`).

---

## 7. UI/UX Rules

- **Mobile-First Design**: Optimize touch targets (minimum 44x44dp). Always respect device notches, status bars, and safe areas using `react-native-safe-area-context`.
- **Design System Consistency**: Adhere strictly to the tokens in `DESIGN.md`:
  - **Slate Neutrals**: Backgrounds should be Slate-based (`#F8FAFC` for Light Theme, `#040908` for Dark Theme). Never use pure white `#FFFFFF` or pure black `#000000` for main layouts.
  - **Green/Emerald Accents**: Primary actions and growth metrics must use Green 500 (`#22C55E`), Green 300/400 (`#86EFAC` / `#4ADE80`), or Green 200/300 (`#BBF7D0` / `#86EFAC`).
  - **Typography Hierarchy**: Honor the font family (Inter) and typography scale (Display Large 40px, Headline Large 28px, Title Large 18px, Body Large 15px, Label Large 14px, Label Medium 12px) exactly.
- **Simplicity**: Prioritize strategic whitespace, subtle outlines, and elegant transitions over heavy borders, cluttered cards, or slow animations.
- **Accessibility**:
  - Support VoiceOver and TalkBack by supplying proper `accessibilityLabel`, `accessibilityRole`, and `accessibilityState` details.
  - Maintain contrast ratios satisfying WCAG AA compliance (4.5:1 for normal text, 3:1 for large text).

---

## 8. Code Quality Rules

- **Readability**: Write self-documenting code. Do not add comments to the codebase. Clear naming and clean function structures should make the code self-explanatory.
- **Naming Conventions**:
  - Use `camelCase` for variable names, functions, and files (e.g., `dateFilters.ts`).
  - Use `PascalCase` for React components, contexts, and TypeScript types/interfaces (e.g., `TransactionRow.tsx`, `MonthlyMetrics`).
  - Use `UPPER_SNAKE_CASE` for global constant declarations.
- **Function Size**: Functions must follow the Single Responsibility Principle. If a function exceeds 30 lines (excluding inline SQL statements), it should be refactored into smaller sub-functions.
- **Refactoring Guidance**: Abstract complex database aggregation or formatting code out of screen components into helper functions or selector hooks.
- **Error Handling**: Standardize database interactions inside `try/catch` blocks. Do not crash the app on DB execution failures; log the error to console warnings and display user-friendly fallback states or alerts.

---

## 9. Performance Rules

- **Avoid Re-renders**: Use precise Zustand selectors instead of destructuring the whole store hook (e.g., `const currentBalance = useStore(state => state.currentBalance)`).
- **Database Query Limits**: Cap standard transactions listings at a reasonable limit (`LIMIT 300` or `1000` rows) in database queries to save memory.
- **Lists**: Utilize `@shopify/flash-list` or `react-native-draggable-flatlist` instead of standard `ScrollView` or standard `FlatList` for transaction histories to guarantee 60fps scrolling.
- **No Premature Optimization**: Do not implement over-complicated caching layers. SQLite is fast enough for localized data. Focus on optimizing slow DB queries and removing unnecessary layout passes first.

---

## 10. AI Agent Instructions

- **Prioritize Rules**: AI agents must read and strictly follow this document and `DESIGN.md` in every response and code modification task.
- **Preserve Patterns**: Always check the repository for existing patterns (e.g., SQLite query formatting, state slicing, localization lookup mechanisms) before introducing new abstractions. Favor consistency over novelty.
- **Protect Financial Integrity**: Never perform code modifications that risk desynced account balances, incorrect transaction signs, or unsafe database writes.
- **Clarify Ambiguity**: If feature requirements or financial rules (such as calculations, date boundaries, or database schemas) are ambiguous, pause and request clarification from the user.
