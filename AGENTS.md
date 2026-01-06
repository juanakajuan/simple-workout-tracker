# AGENTS.md

This file provides guidance to agentic coding tools when working with code in this repository.

## Project Overview

Zenith is a Progressive Web App (PWA) for workout tracking. It's a mobile-first fitness tracker that runs entirely in the browser with offline support. All data is persisted locally using localStorage.

**Tech Stack**: React 19 + TypeScript 5.9 + Vite 7 + React Router DOM 7 + vite-plugin-pwa

## Commands

```bash
npm run dev          # Start Vite dev server with HMR at http://localhost:5173
npm run build        # Type-check with tsc, then build production bundle
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all .ts/.tsx files
npm run lint:fix     # Run ESLint and auto-fix issues
npm run format       # Format all TypeScript/CSS with Prettier
tsc -b               # Type-check all TypeScript projects
tsc -b --watch       # Type-check in watch mode
```

**Note**: There are no tests configured. Do not attempt to run test commands.

## Code Style Guidelines

### TypeScript & Types

- Use explicit types for function parameters and return values
- Use `import type` for type-only imports; avoid `any`
- Prefer `interface` for object shapes, `type` for unions/intersections
- Always use named exports (`export function ComponentName`)
- Add TSDoc comments to all utility functions and exported types

```typescript
import type { Exercise, Workout } from "../types";

interface ComponentProps {
  exercise: Exercise;
  onClick?: () => void;
}

export function Component({ exercise, onClick }: ComponentProps) {
  /* ... */
}
```

### Import Order

Separate by blank lines in this order:

1. External dependencies (React, third-party libraries)
2. Type imports (`import type { ... }`)
3. Utility/function imports from `src/utils/` and `src/hooks/`
4. Component imports
5. CSS imports (always last)

```typescript
import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";

import type { Exercise, Workout } from "../types";

import { generateId, STORAGE_KEYS } from "../utils/storage";
import { useLocalStorage } from "../hooks/useLocalStorage";

import { ExerciseCard } from "../components/ExerciseCard";

import "./WorkoutPage.css";
```

### Naming Conventions

- Components/Types/Interfaces: `PascalCase` (`ExerciseCard`, `WorkoutSet`, `ComponentProps`)
- Files: Match component name (`ExerciseCard.tsx`, `ExerciseCard.css`)
- Functions/variables: `camelCase` (`generateId`, `getExercises`, `handleDelete`)
- Constants: `SCREAMING_SNAKE_CASE` (`STORAGE_KEYS`, `DEFAULT_EXERCISES`)
- CSS classes: `kebab-case` (`exercise-card`, `btn-primary`)
- Event handlers: Prefix with `handle` (`handleDelete`, `handleSubmit`)
- Custom hooks: Prefix with `use` (`useLocalStorage`)

### Formatting (Prettier)

Semicolons: **Yes** | Quotes: **Double** | Tab: **2 spaces** | Trailing commas: **ES5** | Print width: **100**

### Error Handling & React Patterns

- **localStorage operations**: Always wrap in try-catch, return sensible defaults
- **Destructive actions**: Always use `confirm()` before delete or cancel operations
- **Input validation**: Fallback to 0 for empty/invalid numeric inputs
- **Console errors**: Log with context: `console.error('Error reading key:', error)`
- **State updates**: Use functional updates when new state depends on previous state
- **Conditional rendering**: Use early returns for page-level components
- **Component structure**: Define `{ComponentName}Props` interface above component

```typescript
export function getExercises(): Exercise[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXERCISES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
```

### CSS Guidelines

- Use CSS variables from `index.css`: `var(--bg-card)`, `var(--accent)`, `var(--text-primary)`
- Use global utility classes: `.btn`, `.card`, `.tag`
- Component-scoped classes: `.exercise-card`, `.set-row`
- Mobile-first design with 60px bottom clearance for tab navigation
- Dark theme only (no light mode support)
- No hover styles (mobile-first PWA)
- Use `aria-label` for icon-only buttons, `aria-expanded` for menus

## Architecture

### Data Flow & State

- **No global state library**: React hooks + local component state only
- **Persistent storage**: All data in localStorage via `useLocalStorage` hook
- **Cross-tab sync**: `useLocalStorage` automatically syncs across browser tabs via storage events
- **Storage keys** (defined in `src/utils/storage.ts`):
  - `zenith_exercises`: User's exercise library
  - `zenith_workouts`: Completed workout history
  - `zenith_active_workout`: Current in-progress workout
  - `zenith_templates`: Workout templates
  - `zenith_settings`: User preferences

### Type System (`src/types/index.ts`)

Core types:

- `Exercise`: User exercises (id, name, muscleGroup, exerciseType, notes)
- `Workout`: WorkoutExercise array + metadata (id, name, date, completed)
- `WorkoutExercise`: Links Exercise to Workout with WorkoutSet array
- `WorkoutSet`: Individual set data (id, weight, reps, completed)
- `WorkoutTemplate`: Quick workout templates (id, name, days with exercises)
- `Settings`: User preferences (autoMatchWeight, etc.)

**ID generation**: Always use `generateId()` from `src/utils/storage.ts`. Never create IDs manually.

### Application Structure

```
src/
├── pages/         # Full-page views, manage state and localStorage interactions
├── components/    # Reusable UI components, mostly presentational
├── hooks/         # Custom React hooks (useLocalStorage)
├── utils/         # Utility functions (storage, formatting)
├── types/         # TypeScript type definitions
└── data/          # Static data (DEFAULT_EXERCISES)
```

**Routing**: React Router DOM - `/exercises`, `/workout`, `/history`, `/templates`, `/settings`
**Navigation**: `BottomTabBar` provides mobile-style tab navigation

### Key Patterns

**localStorage utilities** (`src/utils/storage.ts`):

```typescript
import {
  STORAGE_KEYS,
  generateId,
  getExercises,
  saveExercises,
  getWorkouts,
  saveWorkouts,
  getActiveWorkout,
  saveActiveWorkout,
  getTemplates,
  saveTemplates,
  DEFAULT_EXERCISES,
} from "../utils/storage";
```

**Reactive localStorage state**:

```typescript
const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
```

**Workout lifecycle**:

1. **Start**: Create Workout, save to `zenith_active_workout`
2. **Track**: Add exercises/sets, auto-sync to localStorage on every change
3. **Finish**: Move to `zenith_workouts` array, clear `zenith_active_workout`
4. **Cancel**: Delete `zenith_active_workout` without saving to history

## Common Tasks

### Adding a new feature

1. Make changes (prefer editing existing files over creating new ones)
2. `npm run lint:fix` → auto-fix ESLint issues
3. `npm run format` → format code with Prettier
4. `tsc -b` → verify types pass
5. Test manually in browser (do NOT start dev server via commands)

### Adding a component

1. Create `ComponentName.tsx` + `ComponentName.css` in `src/components/`
2. Define `ComponentNameProps` interface above component function
3. Use named export: `export function ComponentName({ ...props }) { ... }`
4. Import CSS at bottom of .tsx file
5. Use global utility classes (`.btn`, `.card`, `.tag`) where applicable

### Modifying types

1. Update `src/types/index.ts`
2. Update related files (`src/utils/storage.ts` if storage-related)
3. Run `tsc -b` to catch all type errors
4. Fix all errors before proceeding

### Adding new utility functions

1. Add to appropriate file in `src/utils/` (usually `storage.ts`)
2. Add TSDoc comments explaining purpose, parameters, and return value
3. Export function and use in components via import
4. Update type definitions if needed

## Agent-Specific Rules

- **Question formatting**: When asking questions with multiple options, use lettered choices (a, b, c) instead of bullets for easy response
- **Abbreviations**: Avoid abbreviations in code and communication
