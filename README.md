# Simple Workout Tracker

A Progressive Web App for workout tracking. Mobile-first fitness tracker that runs entirely in the browser with offline support.

## Tech Stack

- React 19
- TypeScript 5.9
- Vite 7
- React Router DOM 7
- vite-plugin-pwa
- Lucide React (icons)
- Vitest + Testing Library (testing)
- ESLint + Prettier (lint/format)

## Getting Started

```bash
npm install
npm run dev
```

Visit <http://localhost:5173>

## Scripts

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm run dev`      | Start dev server                    |
| `npm run build`    | Type-check and build for production |
| `npm run preview`  | Preview production build            |
| `npm test`         | Run tests (Vitest + jsdom)          |
| `npm run lint`     | Lint with ESLint                    |
| `npm run lint:fix` | Auto-fix lint issues                |
| `npm run format`   | Format with Prettier                |

## Features

- **Exercise library** — 12 muscle groups, 8 equipment types, pre-populated default exercises + custom exercise CRUD
- **Workout tracking** — Active workout session with timer, sets/reps/weight logging, auto-match previous weights
- **Workout templates** — Create reusable templates organized by muscle group with exercise presets
- **Workout history** — Completed workout log with detail views and weekly sets tracker
- **Exercise history** — Per-exercise performance history across workouts
- **Data portability** — Export/import JSON backups of all app data
- **Offline support** — PWA with service worker, installable on mobile/desktop
- **Local storage** — All data persisted in localStorage, no server required

## Data Storage

All data is stored locally in the browser using localStorage with `simple_workout_tracker_` prefixed keys. Data is automatically validated and normalized on read to handle schema migrations gracefully.
