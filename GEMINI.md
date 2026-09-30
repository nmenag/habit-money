# Habit Money - Gemini Context

This document provides foundational mandates, architectural rules, and development guidelines for the Habit Money project.

## Project Overview

Habit Money is a high-performance, offline-first personal finance tracker built with **React Native** and **Expo**. It uses local SQLite as the sole source of truth and Zustand for in-memory state management.

### Key Technologies

- **Core**: Expo SDK 55, React Native 0.83, TypeScript (Strict Mode)
- **Routing**: Expo Router (file-based navigation)
- **State**: Zustand v5 (Sliced & Persisted store)
- **Database**: Expo SQLite (Local storage, WAL mode)
- **UI**: React Native Paper v5 (Material Design 3), Inter font family
- **Animations**: React Native Reanimated v4
- **Performance**: @shopify/flash-list for high-performance lists

## Architecture & Development Rules

### 1. Strict TypeScript

- **No `any`**: Always declare explicit types.
- **Explicit Returns**: Always declare return types for exported helpers, hooks, and store slices.

### 2. Separation of Concerns

- **UI Components**: Must be purely representational. No direct DB calls or heavy computation.
- **Store Slices (`src/store/slices/`)**: Encapsulate state logic and database interactions. Act as the Repository layer.
- **Services (`src/services/`)**: House complex algorithms (Analytics, Insights) to keep stores thin.
- **Database Layer (`src/db/schema.ts`)**: Handles schema initialization and migrations.

### 3. Financial Logic & Integrity

- **Money Calculations**: Perform calculations carefully to avoid floating-point issues. Values are stored as `REAL NOT NULL`.
- **Formatting**: Always use the store's `formatCurrency` helper for UI representation.
- **Balances**: `currentBalance` = `initialBalance` + net sum of transactions. Manual overrides must be recorded as balance adjustment transactions.
- **Transfers**: Must update both source and destination account balances simultaneously.
- **Validation**: Transactions must enforce `amount > 0` and exist for valid categories/accounts.

### 4. Database Guidelines

- **Pragmas**: Initialized on start (WAL mode, Normal sync, Memory temp store).
- **Repository Pattern**: Components must NEVER call `getDb()` or run SQL. Use store slices instead.
- **Data Integrity**: Enforce foreign keys (e.g., `ON DELETE SET NULL` for categories). Use indexes on `date`, `accountId`, and `categoryId`.
- **Query Limits**: Cap transaction listings (e.g., `LIMIT 1000`) to save memory.

### 5. UI/UX & Design System

- **Design Tokens**: Follow `DESIGN.md`. Use Slate-based neutrals (`#F8FAFC` Light, `#040908` Dark).
- **Emerald/Green Accents**: Use `#22C55E` for primary actions and income metrics.
- **Typography**: Strictly use Inter font scale (Display 40px, Headline 28px, Title 18px, Body 15px).
- **Spacing**: Use the 4–8px grid (xs: 4px, sm: 8px, md: 16px, lg: 24px).
- **Accessibility**: Support VoiceOver/TalkBack with `accessibilityLabel` and 44x44dp touch targets.

## Building and Running

- **Metro Bundler**: `npm start`
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Quality Control**: `npm run lint`, `npm run check-types`, `npm run doctor`
- **Variants**: Use `APP_VARIANT=development`, `preview`, or `production`.

## Testing & Validation

- **Theme Testing**: Always verify changes in both Light and Dark modes.
- **Data Consistency**: Ensure account balances and transaction history remain synced after modifications.
- **Performance**: Ensure scrolling remains at 60fps on lists using FlashList.

## Pull Requests

When asked to generate a PR, keep it extremely concise, format it exactly using the structure of `.github/PULL_REQUEST_TEMPLATE.md`, and always return the output wrapped inside a markdown code block:

# PR Title

<!-- Use a Conventional Commit title, e.g., feat: integrate Firebase Analytics -->

## Summary

<!-- Keep descriptions extremely concise (1-2 sentences maximum) and focused on business value. Why are we doing this? -->

## Changes

<!-- Detail the key changes. Keep bullet points brief (2-4 bullets, max 1 line each) -->

## Testing Notes

<!-- Describe how the changes were verified in a single line -->

## Breaking Changes (if any)

<!-- List breaking changes or "None" -->

## Release Notes (Notas de la versión / notes version)

When asked to write or generate release notes ("Notas de la versión", "notes version", "release notes", or `/aso notes version`), always produce them wrapped **strictly inside a markdown code block** (` ``` `) so that the XML/HTML tags `<es-419>` and `<en-US>` are preserved and never stripped by markdown renderers:

````
```
<es-419>
Ingresa o pega aquí las notas de la versión para el idioma "es-419".
</es-419>
<en-US>
Ingresa o pega aquí las notas de la versión para el idioma "en-US".
</en-US>
```
````

- Always include both `es-419` (Latin American Spanish) and `en-US` (English) blocks.
- Keep the notes concise, user-facing, bullet-pointed, and focused on what changed or improved from the user's perspective.
- Do not include technical jargon, internal ticket numbers, or developer-facing details.
