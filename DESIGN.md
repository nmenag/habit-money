# Habit Money — Design System & Visual Tokens

This document outlines the visual tokens, typography hierarchy, spacing guidelines, and design principles for the Habit Money application.

---

## 1. Color System

Habit Money uses a Slate-based neutral scale, Emerald/Green accents for positive cash flow, and Amber for warnings and alerts.

### 1.1 The Color Palettes

#### Slate (Neutrals)

- **Slate 50**: `#F8FAFC` (Light Background / Surface / Elevation Level 1)
- **Slate 100**: `#F1F5F9`
- **Slate 200**: `#E2E8F0` (Dark Theme primary text)
- **Slate 300**: `#CBD5E1`
- **Slate 400**: `#94A3B8` (Dark Theme secondary text)
- **Slate 500**: `#64748B`
- **Slate 600**: `#475569` (Light Theme secondary text)
- **Slate 700**: `#334155` (Light Theme variant text)
- **Slate 800**: `#1E293B`
- **Slate 900**: `#0F172A` (Light Theme primary text)
- **Slate 950**: `#020617`

#### Green & Emerald (Brand Accents & Income)

- **Green 50**: `#F0FDF4`
- **Green 100**: `#DCFCE7` (Light theme income container)
- **Green 200**: `#BBF7D0` (Light theme tertiary accent)
- **Green 300**: `#86EFAC` (Light theme secondary / Dark theme tertiary)
- **Green 400**: `#4ADE80` (Dark theme secondary / income text)
- **Green 500**: `#22C55E` (Brand Primary color)
- **Green 600**: `#16A34A`
- **Green 700**: `#15803D` (Light theme income text)
- **Green 800**: `#166534`
- **Green 900**: `#14532D`
- **Green 950**: `#052E16`
- **Emerald 900**: `#064E3B` (Dark theme income container)
- **Emerald 950**: `#065F46`

#### Amber (Warnings & Alerts)

- **Amber 400**: `#FBBF24` (Dark theme warning text)
- **Amber 500**: `#F59E0B`
- **Amber 600**: `#D97706`
- **Amber 700**: `#B45309` (Light theme warning text)

### 1.2 Semantic Theme Color Maps

| Token                | Light Theme | Dark Theme | Purpose / Usage                                          |
| :------------------- | :---------- | :--------- | :------------------------------------------------------- |
| **primary**          | `#22C55E`   | `#22C55E`  | Main actions, primary buttons, positive growth           |
| **secondary**        | `#86EFAC`   | `#4ADE80`  | Accent lines, secondary buttons, highlights              |
| **tertiary**         | `#BBF7D0`   | `#86EFAC`  | Subtle backgrounds, category tags, badges                |
| **background**       | `#F8FAFC`   | `#040908`  | Screen background color (Never pure white or pure black) |
| **surface**          | `#F8FAFC`   | `#0A110F`  | Containers, card surfaces, bottom sheets                 |
| **onSurface**        | `#0F172A`   | `#E2E8F0`  | Primary text and readability elements                    |
| **onSurfaceVariant** | `#475569`   | `#94A3B8`  | Subdued metadata, secondary labels, helper text          |
| **income**           | `#15803D`   | `#4ADE80`  | Positive flow transaction text, positive trends          |
| **incomeContainer**  | `#DCFCE7`   | `#064E3B`  | Background for positive tags, success alerts             |
| **warning**          | `#B45309`   | `#FBBF24`  | Budget exceeded text, alert labels                       |
| **warningContainer** | `#FEF3C7`   | `#451A03`  | Budget exceeded background, alert containers             |
| **outlineVariant**   | —           | —          | Subtle borders and divider elements                      |

---

## 2. Typography

All typography is rendered using the **Inter** font family (Inter-Regular, Inter-Medium, Inter-SemiBold).

| Role                | Font Family    | Size | Line Height | Letter Spacing | Weight | Typical Usage                     |
| :------------------ | :------------- | :--- | :---------- | :------------- | :----- | :-------------------------------- |
| **Display Large**   | Inter-SemiBold | 40px | 48px        | -1.0px         | 600    | Large statistics, landing numbers |
| **Display Medium**  | Inter-SemiBold | 34px | 40px        | -0.5px         | 600    | Mid-sized statistics display      |
| **Display Small**   | Inter-SemiBold | 30px | 36px        | 0.0px          | 600    | Small statistics display          |
| **Headline Large**  | Inter-SemiBold | 28px | 34px        | 0.0px          | 600    | Core screen headers               |
| **Headline Medium** | Inter-SemiBold | 24px | 30px        | 0.0px          | 600    | Subscreen/modal headers           |
| **Headline Small**  | Inter-SemiBold | 20px | 26px        | 0.0px          | 600    | Dialog and alert headers          |
| **Title Large**     | Inter-Medium   | 18px | 24px        | 0.15px         | 500    | Section headers                   |
| **Title Medium**    | Inter-Medium   | 16px | 22px        | 0.15px         | 500    | Cards and row titles              |
| **Title Small**     | Inter-Medium   | 15px | 20px        | 0.1px          | 500    | Dense list subheadings            |
| **Body Large**      | Inter-Regular  | 15px | 22px        | 0.15px         | 400    | Primary body and details          |
| **Body Medium**     | Inter-Regular  | 14px | 20px        | 0.25px         | 400    | General reading, descriptions     |
| **Body Small**      | Inter-Regular  | 13px | 18px        | 0.4px          | 400    | Footnotes, legal text, timestamps |
| **Label Large**     | Inter-Medium   | 14px | 20px        | 0.1px          | 500    | Buttons, input forms              |
| **Label Medium**    | Inter-Medium   | 12px | 16px        | 0.5px          | 500    | Badges, small chips, tabs         |
| **Label Small**     | Inter-Regular  | 12px | 16px        | 0.5px          | 400    | Timestamps, micro-labels          |

---

## 3. Spacing System

Habit Money uses a strict 4–8px spacing grid for margins, paddings, and alignment:

- **Extra Small (xs)**: `4px` — Micro margins, sub-components, small adjustments
- **Small (sm)**: `8px` — Spacing between icons and text, grid item gaps, tight padding
- **Medium (md)**: `16px` — Screen padding, default list gaps, card inner padding
- **Large (lg)**: `24px` — Screen side margin, spacing between page sections
- **Extra Large (xl)**: `32px` — Main header bottom margins, hero container spacing
- **Double Extra Large (xxl)**: `48px` — Spacing before footer buttons, hero block offsets

---

## 4. Visual Elements & Shapes

- **Card Roundness**: Standard component border-radius is set to `12px` (as defined by `roundness: 12` in MD3 themes). Large buttons, tags, or pills can use pill structures (e.g., `borderRadius: 100`).
- **Elevation**: Shadow configurations use soft, transparent slate hues (`MD3LightTheme.colors.elevation`) rather than harsh solid borders.

---

## 5. Chart & Data Visualization Colors

When rendering reports, transaction charts, or category breakdowns, cycle through the following structured palette to maintain visual harmony:

```javascript
export const chartColors = [
  '#22C55E', // Green 500 (Primary)
  '#3B82F6', // Blue
  '#F59E0B', // Amber 500
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#10B981', // Emerald 500
  '#6366F1', // Indigo
];
```

---

## 6. Accessibility & Contrast

- All text colors must maintain contrast ratios meeting WCAG AA requirements:
  - **4.5:1** contrast ratio for regular body text.
  - **3:1** contrast ratio for display/headline text.
- Touch target sizes must be at least **44x44dp** to guarantee reliable tap recognition.
