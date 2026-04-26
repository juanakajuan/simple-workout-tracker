## Progressive Overload and PR Tracking

Goal: make progress visible during workouts and in history so the app helps users improve, not just log.

Why this fits now:

- Completed workouts already store enough data to derive best sets, total volume, and estimated 1RM.
- `src/pages/WorkoutPage.tsx`, `src/pages/ExerciseHistoryPage.tsx`, and `src/pages/WorkoutDetailPage.tsx` already surface the right contexts for this information.

Checklist:

- [ ] Add derived stats helpers for exercise progress, including best set, best session volume, and estimated 1RM.
- [ ] Define what counts as a PR for each exercise type.
- [ ] Show all-time PR summaries on `src/pages/ExerciseHistoryPage.tsx`.
- [ ] Show recent-vs-previous comparisons during active workouts in `src/pages/WorkoutPage.tsx`.
- [ ] Add visual badges or callouts when a set or workout matches or beats a previous best.
- [ ] Surface PR context in `src/pages/WorkoutDetailPage.tsx` for completed sessions.
- [ ] Add tests for the new progress calculations and PR labeling rules.

Implementation notes:

- Keep this mostly derived from existing workout history first instead of storing extra snapshot data.
- The cleanest home is likely a new stats helper alongside `src/utils/storage.ts` and `src/utils/workoutUtils.ts`.
- Bodyweight and loaded-bodyweight exercises need slightly different PR rules than fixed-weight lifts.

Possible MVP:

- Best weight x reps set
- Best total session volume for an exercise
- Estimated 1RM
- "New PR" badge in workout completion and exercise history

## Better Analytics

Goal: expand history from a log into a trends view that explains training patterns over time.

Why this fits now:

- `src/pages/HistoryPage.tsx` and `src/pages/WeeklySetsTrackerPage.tsx` already establish history and trend reporting.
- The app already tracks workouts, duration, sets, and volume.

Checklist:

- [ ] Add a dedicated analytics page or extend the History section with a deeper trends view.
- [ ] Show volume trends over time by week and month.
- [ ] Show workout frequency trends over time.
- [ ] Show session duration trends using stored workout durations.
- [ ] Show top exercises by volume, sets, and frequency.
- [ ] Show muscle-group distribution using exercise metadata.
- [ ] Add month-over-month and week-over-week summary cards.
- [ ] Keep chart rendering dependency-light, ideally with CSS or simple SVG before adding a chart library.
- [ ] Add tests for aggregation logic and empty-state handling.

Implementation notes:

- Reuse the same merged exercise resolution pattern already present in `HistoryPage`, `WorkoutDetailPage`, and `WeeklySetsTrackerPage`.
- Most of the work is aggregation and presentation; the current storage model should be enough for an MVP.
- Consider creating one shared analytics utility instead of repeating reductions across pages.

Possible MVP:

- Weekly total volume chart
- Workouts per week chart
- Average workout duration this month
- Most-used exercises in the last 30 days

## Units and Personalization

Scope for this phase:

- lb / kg toggle
- default bar weight
- keep screen awake during workouts

Goal: make the app more flexible for different gyms, countries, and training setups.

Checklist:

- [ ] Extend `Settings` in `src/types/index.ts` with `weightUnit`, `defaultBarWeight`, and `keepScreenAwakeDuringWorkout`.
- [ ] Update settings persistence and normalization in `src/utils/storage.ts`.
- [ ] Add settings controls in `src/pages/SettingsPage.tsx`.
- [ ] Centralize weight display and conversion logic so all screens render the selected unit consistently.
- [ ] Update workout entry, history, exercise history, and analytics displays to use the selected unit.
- [ ] Replace the fixed `STANDARD_BARBELL_WEIGHT` assumption where appropriate with the user-configured bar weight.
- [ ] Update the plate calculator copy and calculations to respect the configured bar weight.
- [ ] Add a wake-lock hook for workouts using the browser Wake Lock API with graceful fallback.
- [ ] Enable wake lock only while an active workout is open and the setting is turned on.
- [ ] Add tests for settings normalization, unit formatting, and wake-lock behavior boundaries.

Implementation notes:

- A small formatting helper layer will prevent repeated `lbs` string handling across pages.
- Unit conversion should be display-aware first; avoid silently rewriting stored history on initial rollout.
- Keep the wake-lock integration isolated in a hook so `WorkoutPage` stays manageable.

Possible touchpoints:

- `src/types/index.ts`
- `src/utils/storage.ts`
- `src/utils/workoutUtils.ts`
- `src/pages/SettingsPage.tsx`
- `src/pages/WorkoutPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/ExerciseHistoryPage.tsx`
- `src/pages/WorkoutDetailPage.tsx`

## Workout Notes and Session Ratings

Goal: capture context that raw set data misses, like how a session felt and what changed that day.

Why this fits now:

- Exercises already support notes in `src/pages/ExerciseFormPage.tsx`, but workouts do not capture session-specific notes.
- History pages are already set up to surface richer detail.

Checklist:

- [ ] Extend workout data with a workout-level notes field.
- [ ] Add a session rating field, such as difficulty, energy, or overall quality.
- [ ] Decide whether exercise-level session notes should be included in the first release.
- [ ] Add editing UI in `src/pages/WorkoutPage.tsx` for in-progress workout notes and rating.
- [ ] Show saved notes and rating in `src/pages/WorkoutDetailPage.tsx`.
- [ ] Surface note previews in `src/pages/HistoryPage.tsx` where useful.
- [ ] Update import/export and normalization logic in `src/utils/storage.ts`.
- [ ] Add tests covering note persistence, optional values, and display states.

Implementation notes:

- Workout-level notes and rating are the best MVP.
- Exercise-level session notes are useful, but they add more UI density to `WorkoutPage`.
- Keep rating simple at first, for example a 1-5 scale or a small enum.

## Calendar View

Goal: give users a fast way to see consistency, gaps, and training density by date.

Why this fits now:

- History is currently list-based only.
- The app already stores workout dates and has a dedicated history section.

Checklist:

- [ ] Add a calendar page under the History area.
- [ ] Add routing from `src/App.tsx` and entry points from `src/pages/HistoryPage.tsx`.
- [ ] Render a month view with indicators for workout days.
- [ ] Show workout counts and quick summaries when selecting a day.
- [ ] Link from a calendar day into workout detail pages.
- [ ] Support browsing previous and next months.
- [ ] Decide whether to show muscle-group color accents on workout days.
- [ ] Add tests for date grouping, month navigation, and empty months.

Implementation notes:

- Start with a simple month grid and local date handling.
- Reuse the existing date formatting conventions already present in history-related pages.
- Be careful with timezone boundaries because workout dates are stored as ISO strings.

Possible MVP:

- Current month grid
- Dots or counts on days with workouts
- Tap day to list workouts below the calendar

## Exercise Substitution System

Goal: make exercise replacement faster and smarter when equipment is taken or the user wants a variation.

Why this fits now:

- `src/pages/WorkoutPage.tsx`, `src/pages/TemplateEditorPage.tsx`, and `src/pages/ExerciseSelectorPage.tsx` already support exercise replacement flows.
- The current exercise model includes muscle group and exercise type, which is enough for a first-pass similarity system.

Checklist:

- [ ] Define substitution rules using muscle group and exercise type.
- [ ] Add a "similar exercises" section to `src/pages/ExerciseSelectorPage.tsx` when replacing an exercise.
- [ ] Highlight the best replacement candidates before showing the full list.
- [ ] Preserve current template-update behavior when substitutions happen inside template-backed workouts.
- [ ] Add one-tap replacement actions from `src/pages/WorkoutPage.tsx`.
- [ ] Consider whether templates should support preferred substitutions later.
- [ ] Add tests for similarity ranking and replacement flows.

Implementation notes:

- Keep the first version heuristic-based instead of adding a complex tagging system.
- A strong MVP is same muscle group first, then same exercise type, then full exercise list fallback.
- This feature becomes even better after units, notes, and progress comparisons are in place.

## Suggested Build Order

- [ ] 1. Units and Personalization
- [ ] 2. Progressive Overload and PR Tracking
- [ ] 3. Workout Notes and Session Ratings
- [ ] 4. Better Analytics
- [ ] 5. Calendar View
- [ ] 6. Exercise Substitution System

Rationale:

- Units and personalization create shared infrastructure that affects many screens.
- Progress tracking and workout notes deepen the core workout loop.
- Analytics and calendar build on the same historical data once it is richer.
- Exercise substitution is valuable now, but it can stay lightweight until the rest of the workout experience is stronger.

## Architectural Deepening

Goal: turn the highest-friction shallow seams from `docs/DEEPENING_OPPORTUNITIES.md` into deeper modules with better locality, leverage, and testability.

Checklist:

- [x] Deepen active workout session module around workout mutations and template-backed sync.
- [ ] Deepen template composition module for ordering, grouping, replacements, set counts, and rebuild behavior.
- [ ] Split storage and backup concerns into persisted data, backup import/export, and relationship repair seams.
- [ ] Deepen exercise catalog module for merged lookup, default/custom classification, overrides, and deleted fallback.
- [ ] Deepen exercise selection flow module to own navigation-state protocol, draft preservation, and template-update choices.
- [ ] Deepen training history analytics module for derived workout facts and reusable analytics calculations.
- [ ] Unify confirmation and alert behavior behind the application dialog module.

Implementation notes:

- Use `docs/DEEPENING_OPPORTUNITIES.md` as the source of architectural rationale and file touchpoints.
- Start with the high-priority seams that affect active workout behavior, template behavior, storage, and exercise identity.
- Prefer extracting plain domain behavior behind typed interfaces before moving UI state.
