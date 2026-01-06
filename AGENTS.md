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
- Use named exports (except for React page components)

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

Separate by blank lines:

1. External dependencies (React, third-party libs)
2. Type imports (`import type`)
3. Utility/function imports
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

- Components/Types: `PascalCase` (`ExerciseCard`, `WorkoutSet`)
- Files: Match component name (`ExerciseCard.tsx`, `ExerciseCard.css`)
- Functions: `camelCase` (`generateId`, `getExercises`)
- Constants: `SCREAMING_SNAKE_CASE` (`STORAGE_KEYS`, `DEFAULT_EXERCISES`)
- CSS classes: `kebab-case` (`exercise-card`, `btn-primary`)

### Formatting (Prettier)

- Semicolons: Yes | Quotes: Double | Tab: 2 spaces | Trailing commas: ES5 | Print width: 100

### Error Handling & React Patterns

- **localStorage**: Wrap in try-catch, return sensible defaults
- **Destructive actions**: Use `confirm()` (delete, cancel)
- **Input validation**: Fallback to 0 for empty/invalid numeric inputs
- **Console errors**: Log with context: `console.error('Error reading key:', error)`
- **Event handlers**: Prefix with `handle` (`handleDelete`, `handleClickOutside`)
- **Custom hooks**: Prefix with `use` (`useLocalStorage`)
- **Conditional rendering**: Use early returns for page-level components
- **State updates**: Use functional updates when new state depends on previous state

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

### Component Structure

- Define `{ComponentName}Props` interface above component
- Destructure props in function signature
- Co-locate CSS: `SetRow.tsx` + `SetRow.css`
- Use `aria-label` for icon-only buttons, `aria-expanded` for menus

### CSS Guidelines

- Use CSS variables from `index.css`: `var(--bg-card)`, `var(--accent)`
- Use global utility classes: `.btn`, `.card`, `.tag`
- Component-scoped classes: `.exercise-card`, `.set-row`
- Mobile-first design with 60px bottom clearance for tab navigation
- Dark theme only (no light mode)

## Architecture

### Data Flow & State

- **No global state library**: React hooks + local component state only
- **Persistent storage**: All data in localStorage via `useLocalStorage` hook
- **Storage keys** (`src/utils/storage.ts`):
  - `zenith_exercises`: User's exercise library
  - `zenith_workouts`: Completed workout history
  - `zenith_active_workout`: Current in-progress workout
  - `zenith_templates`: Workout templates
- **Cross-tab sync**: `useLocalStorage` listens to storage events

### Type System (`src/types/index.ts`)

- `Exercise`: User exercises (id, name, muscleGroup, exerciseType, notes)
- `Workout`: WorkoutExercise array + metadata (id, name, date, completed)
- `WorkoutExercise`: Links Exercise to Workout with WorkoutSet array
- `WorkoutSet`: Individual set data (id, weight, reps, completed)
- `WorkoutTemplate`: Quick workout templates (id, name, TemplateExercise array)

**ID generation**: Always use `generateId()` from `src/utils/storage.ts`

### Application Structure

- **Pages** (`src/pages/`): Full-page views, manage state and localStorage
- **Components** (`src/components/`): Reusable UI, mostly presentational
- **Routing**: React Router DOM - `/exercises`, `/workout`, `/history`
- **Navigation**: `BottomTabBar` mobile-style tab navigation

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

1. Start: Create Workout, save to `ACTIVE_WORKOUT`
2. Track: Add exercises/sets, auto-sync to localStorage
3. Finish: Move to `WORKOUTS` array, clear `ACTIVE_WORKOUT`
4. Cancel: Delete `ACTIVE_WORKOUT` without saving

**Default exercises**: Merge with user exercises:

```typescript
const allExercises = [...DEFAULT_EXERCISES, ...exercises];
```

## Common Tasks

### Adding a new feature

1. `npm run dev` → start dev server
2. Make changes (prefer editing existing files)
3. `npm run lint` → check issues
4. `npm run format` → format code
5. `tsc -b` → verify types
6. Test manually in browser

### Modifying types

1. Update `src/types/index.ts`
2. Update `src/utils/storage.ts` if needed
3. `tsc -b` → catch type errors
4. Fix all errors before proceeding

### Adding a component

1. Create `ComponentName.tsx` + `ComponentName.css` in `src/components/`
2. Define `ComponentNameProps` interface above component
3. Export: `export function ComponentName({ ...props }) { ... }`
4. Import CSS at bottom of .tsx file
5. Use global utility classes where applicable

### Documentation

- Make sure to add TSDoc documentation to new functions added.

### Rules

- When asking questions and giving multiple options, instead of using bullets (-) to list those options, use multiple choice letters so I can easily reply like: 1. a -- 2. b -- 3. c
  - For example:

  ```
      1. The question you are asking
          a) option 1
          b) option 2
          c) option 3
  ```

- Try to avoid using abbreviations
- Don't worry about adding hover styling since this is a mobile-first PWA
