---
name: ui
description: Reference point for all UI changes — design tokens, components, typography, color system, and layout patterns in Voluntrack.
---

# Voluntrack UI Reference

When making any UI changes in Voluntrack, follow these conventions to keep the design consistent and premium.

## 1. Tech Stack

- **Framework:** Next.js (App Router) with `"use client"` directives where interactivity is needed.
- **Styling:** Tailwind CSS v4, imported via `@import "tailwindcss"` in `app/globals.css`.
- **Animations:** `tw-animate-css` (imported in `globals.css`).
- **Component Library:** shadcn/ui primitives in `components/ui/`. Always check for an existing primitive before creating custom components.
- **Class Merging:** Always use the `cn()` helper from `lib/utils.ts` to merge Tailwind classes conditionally (never raw string concatenation).
- **Icons:** `lucide-react`. Keep icon imports tree-shakeable by importing individual icons (e.g., `import { Heart } from "lucide-react"`).
- **Toasts:** Use `sonner` (configured in `components/ui/sonner.tsx`, wrapped in `components/providers.tsx`). Do not use `window.alert()` or custom toast implementations.

## 2. Design Tokens (Color System)

All CSS custom properties live in `app/globals.css` using **oklch** color values, with both `:root` (light) and `.dark` (dark mode) variants.

### Semantic Tokens

| Token                           | Purpose                          |
| ------------------------------- | -------------------------------- |
| `--background`                  | Page background                  |
| `--foreground`                  | Primary text                     |
| `--card` / `-foreground`        | Card surfaces & text             |
| `--primary` / `-foreground`     | Brand CTAs & primary actions     |
| `--secondary` / `-foreground`   | Secondary buttons & badges       |
| `--muted` / `-foreground`       | Disabled / subtle text           |
| `--accent` / `-foreground`      | Highlighted interactive elements |
| `--destructive` / `-foreground` | Danger / delete actions          |
| `--border`                      | Borders & dividers               |
| `--input`                       | Form input borders               |
| `--ring`                        | Focus ring color                 |
| `--chart-1` … `--chart-5`       | Data visualization               |
| `--sidebar-*`                   | Sidebar-specific variants        |

### Usage Rules

- **Never hardcode colors.** Always use token classes (`bg-primary`, `text-foreground`, etc.) so dark mode works automatically.
- The only exception is the centralized color config in `lib/ui-config.ts` (see Section 5).

## 3. Typography

Voluntrack uses two Google Fonts loaded in `app/layout.tsx`:

| Font                   | CSS Variable       | Usage                               |
| ---------------------- | ------------------ | ----------------------------------- |
| **Inter**              | `--font-inter`     | Default body text (`font-sans`)     |
| **Cormorant Garamond** | `--font-cormorant` | Brand / display text (`font-serif`) |

### Rules

- Body text uses Inter via the `font-sans` class (set on `<body>`).
- The logo and hero headings use `font-serif` for the Cormorant Garamond display font.
- Use Tailwind's type scale (`text-sm`, `text-base`, `text-lg`, etc.) — do not use arbitrary `font-size` values.
- Navigation links use `text-sm tracking-wider uppercase` style.

## 4. Component Conventions

### Available shadcn/ui Primitives

Before building custom components, check `components/ui/` for an existing primitive:

`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `button-group`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `dropdown-menu`, `empty`, `field`, `form`, `hover-card`, `input`, `input-group`, `input-otp`, `kbd`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `tooltip`

### Rules

- Import UI primitives from `@/components/ui/<name>` (e.g., `import { Button } from "@/components/ui/button"`).
- Prefer `variant` props over one-off class overrides on shadcn components.
- Use `<Skeleton />` or `loading.tsx` for loading states — never a blank screen.
- Use `<Dialog>` for modals, `<Sheet>` for drawers, `<DropdownMenu>` for context actions.
- The app has a reusable `<Navigation />` component in `components/navigation.tsx` — never create a second navbar.

## 5. Centralized Color Config (`lib/ui-config.ts`)

All data-driven color mappings are centralized in `lib/ui-config.ts`. **Never define color maps locally in page components.**

### Available Maps

| Export                 | Keys                                                                                                               | Fields                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `categoryColors`       | Environment, Community Outreach, Education, Healthcare, Animal Welfare, Arts & Culture, Senior Care, Mental Health | `bg`, `text`, `border`, `gradient`, `heroGradient`, `icon`, `cardBg`, `leftColor` |
| `commitmentColors`     | One-time, Weekly, Monthly                                                                                          | `bg`, `text`                                                                      |
| `statusColors`         | approved, pending, completed, denied, rejected                                                                     | `bg`, `text`, `border`, `icon`, `label`                                           |
| `defaultCategoryColor` | (fallback = Environment)                                                                                           | Same as `categoryColors` entry                                                    |

### Adding a New Entry

1. Add the new key to the appropriate map in `lib/ui-config.ts`.
2. All consumer pages (`Dashboard`, `Applications`, `Opportunities`, etc.) will pick it up automatically.
3. Do **not** duplicate these maps in individual page files.

## 6. Layout Patterns

- **Max width:** Content areas use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Navigation:** Fixed top navbar (`fixed top-0 left-0 right-0 z-50`) with backdrop blur. Account for its height (`h-16 md:h-20`) with top padding on page content.
- **Responsive breakpoints:** Follow Tailwind defaults (`sm:`, `md:`, `lg:`, `xl:`). Mobile-first approach — base styles are mobile, layer up from there.
- **Spacing:** Use Tailwind spacing scale (`gap-4`, `p-6`, `space-y-4`). Avoid arbitrary values.
- **Cards:** Use `<Card>` from shadcn. Group related content into cards with consistent padding.

## 7. Interactivity & Animations

- Use `transition-colors`, `transition-opacity`, or `transition-all` for hover/focus effects.
- Hover states on links: `text-foreground/70 hover:text-foreground`.
- Buttons: Use the `variant` prop (`default`, `outline`, `ghost`, `destructive`) from the shadcn `<Button>`.
- For page transitions or entry animations, use `tw-animate-css` classes.
- Prefer CSS transitions over JS animation libraries.

## 8. Checklist for UI Changes

Before submitting any UI change, verify:

- [ ] Uses design tokens, not hardcoded colors.
- [ ] Uses `cn()` for conditional class merging.
- [ ] Uses existing shadcn/ui primitives where applicable.
- [ ] Colors for categories/statuses/commitments come from `lib/ui-config.ts`.
- [ ] Loading states use `<Skeleton>` or `loading.tsx`.
- [ ] Feedback uses `sonner` toasts, not alerts.
- [ ] Responsive at `sm`, `md`, `lg` breakpoints.
- [ ] Looks correct in both light and dark mode.
- [ ] Icons imported individually from `lucide-react`.
