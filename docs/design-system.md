# Design System Documentation

You are a design assistant integrated into this AI workspace. Use this document as the single source of truth for styling, theming, and component guidelines when generating or modifying UI code. Follow these steps:

1. Read the System Prompt and _Design Tokens_ sections before any code generation.
2. Apply the defined color palette, typography scale, and spacing tokens consistently.
3. Leverage the specified UI component primitives from shadcn/ui and other 2025-standard libraries (e.g., lucide-react, recharts, Framer Motion).
4. Extend or override tokens only by adding to the _Extensibility_ section, never editing core values.
5. Reference component usage examples and patterns to scaffold layouts, forms, and navigation.
6. Ensure all output respects accessibility guidelines and responsive breakpoints.
7. When unspecified by user prompt, choose sensible default components from this document.

## 1. Project Overview

**Name:** Modular AI Scaffold  
**Description:** A modular AI-powered content generation platform with extensible architecture.  
**Platforms:** Web (React/Next.js), Mobile (Expo, React Native)  
**Purpose:** Enable end users to generate and manage AI-powered content with intuitive UI.

## 2. Design Tokens

### 2.1 Color Palette

| Name | Token | Value | Usage |
|------|-------|-------|-------|
| Primary | --color-primary | #3B82F6 | Buttons, links, highlights |
| Secondary | --color-secondary | #6366F1 | Secondary buttons, tabs |
| Accent | --color-accent | #EC4899 | Badges, alerts |
| Neutral | --color-neutral | #F3F4F6 | Backgrounds, cards |
| Surface | --color-surface | #FFFFFF | Card surfaces, sheets |
| Success | --color-success | #10B981 | Success messages |
| Warning | --color-warning | #F59E0B | Warnings |
| Danger | --color-danger | #EF4444 | Errors |

### 2.2 Typography

**Primary Font:** Inter, variable (400–700)  
**Secondary Font:** Roboto, fallback sans-serif

**Scale:**
- h1: 2.25rem / 36px
- h2: 1.875rem / 30px
- h3: 1.5rem / 24px
- body: 1rem / 16px
- small: 0.875rem / 14px

### 2.3 Spacing & Sizing

**Spacing Unit:** 4px  
**Scale:** 1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px  
**Border Radius:** rounded-md (0.375rem), rounded-lg (0.5rem)

## 3. Component Library & Dependencies

- **UI Kit:** shadcn/ui (Button, Card, DropdownMenu, etc.)
- **Icons:** lucide-react
- **Charts:** recharts
- **Animations:** framer-motion (for transitions, hover effects, and page animations)
- **Styling:** tailwindcss + tailwind-variants
- **State Management:** zustand or Jotai
- **Theme Management:** next-themes (for dark/light mode switching)

## 4. Layout Patterns

### 4.1 Responsive Grid

**Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)  
**Container:** max-w-screen-lg mx-auto px-4  
**Grid:** grid grid-cols-1 md:grid-cols-2 gap-4

### 4.2 Navigation

**Web:** shadcn/ui Navbar with horizontal menu, dropdowns  
**Mobile:** Expo BottomTabNavigator using react-navigation, with custom icons.

## 5. Sample Components

### 5.1 Button

```tsx
import { Button } from "@/components/ui/button"

<Button className="bg-primary text-surface hover:bg-primary/90">
  Primary Action
</Button>
```

### 5.2 Card

```tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card"

<Card className="bg-surface shadow p-4 rounded-lg">
  <CardHeader title="Card Title" />
  <CardContent>Some descriptive text here.</CardContent>
</Card>
```

## 6. Theming & Dark Mode

- Enable dark: variants in Tailwind config
- **Dark Tokens:**
  - --color-primary: #2563EB
  - --color-surface: #1F2937
- Wrap root in `<ThemeProvider>` from next-themes or Expo equivalent.

## 7. Accessibility Guidelines

- Contrast ratio ≥ 4.5:1 for body text
- Focus styles: ring-2 ring-offset-2 ring-primary
- aria-label for icon-only buttons
- Semantic HTML and accessibility
- Role in React Native

## 8. Extensibility & Overrides

- **Custom Tokens:** Add under 2.4 Custom Tokens without modifying core tokens.
- **Variant Extensions:** Use tailwind-variants to define new component variants.
- **Color Modes:** Add additional modes in the theme section of Tailwind and next-themes.

## 9. File Structure

```
/src
├── components
│   ├── ui          # shadcn-generated components
│   └── custom      # project-specific wrappers
├── theme.ts        # token definitions
├── pages           # Next.js pages or Expo screens
└── lib             # utils, hooks, state stores
```

### 2.4 Custom Tokens (Extensibility)

**Dark Mode Overrides:**
- --color-primary-dark: #2563EB
- --color-surface-dark: #1F2937

## 10. Versioning & Changelog

**Design Doc Version:** 1.1.0  
**Last Updated:** July 29, 2025

**Changelog:**
- v1.1.0: Added dark mode default, Framer Motion integration, and shadcn/ui alignments for 2025 standards. Updated color tokens and added animation utilities.
- v1.0.0: Initial release with foundational tokens and patterns.