# Deepening Opportunities

This document captures architectural friction in the Simple Workout Tracker codebase and proposes deepening opportunities: refactors that turn shallow Modules into deeper Modules for better testability and AI-navigability.

## Candidates

1. **Active workout session Module**

**Files**: `src/pages/WorkoutPage.tsx`, `src/pages/workout/workoutPageHelpers.ts`, `src/utils/intensityTechniques.ts`, `src/pages/WorkoutPage.test.tsx`

**Problem**: `WorkoutPage.tsx` is a large Module where the Interface includes UI state, storage keys, template sync rules, route state, exercise replacement, set completion, notes, intensity techniques, and finish/cancel behavior. The Module is Deep in behavior but Shallow at the seam because callers and tests must know too much about ordering and local state. The deletion test says much of this complexity would reappear across workout callers and tests.

**Solution**: Deepen an active workout session Module that owns plain workout mutations: start, add exercise, replace exercise, move exercise, update sets, remove exercise, finish, cancel, and template-backed sync.

**Benefits**: More Locality for workout rules; template sync bugs concentrate behind one seam. More Leverage for tests because workout behavior can be exercised through the same Interface the page uses, instead of rendering the full page for every rule.

2. **Template composition Module**

**Files**: `src/pages/TemplateEditorPage.tsx`, `src/pages/workout/workoutPageHelpers.ts`, `src/pages/WorkoutPage.tsx`, `src/pages/TemplatesPage.tsx`

**Problem**: Template flattening and rebuilding exist in both `TemplateEditorPage.tsx` and `workoutPageHelpers.ts`. Template updates during active workouts are position-based, so the Interface leaks implementation details like flat index ordering and muscle group reconstruction.

**Solution**: Deepen a template composition Module that owns ordering, grouping, exercise replacement, set count changes, and rebuild behavior.

**Benefits**: Better Locality for template rules; grouping and ordering bugs stop spreading across editor and workout Modules. More Leverage because tests can verify template behavior once through the template composition Interface rather than duplicating screen-level flows.

3. **Storage and backup Module**

**Files**: `src/utils/storage.ts`, `src/utils/storage.test.ts`, `src/pages/MorePage.tsx`, `src/pages/ExerciseFormPage.tsx`, `src/pages/ExerciseHistoryPage.tsx`

**Problem**: `storage.ts` is a 1182-line Module handling localStorage keys, normalization, import/export, backup download, deletion repair, history queries, settings, active workout persistence, templates, and ID generation. Its Interface is broad enough that callers must understand persistence details and domain repair behavior together.

**Solution**: Deepen storage around narrower seams: persisted Simple Workout Tracker data, backup import/export, and relationship repair. Keep localStorage as an Adapter behind the storage seam.

**Benefits**: More Locality for malformed data, import rollback, and exercise deletion repair. More Leverage for tests because backup and repair behavior can be tested through focused Interfaces instead of one large storage test surface.

4. **Exercise catalog Module**

**Files**: `src/pages/ExercisesPage.tsx`, `src/pages/ExerciseFormPage.tsx`, `src/pages/ExerciseHistoryPage.tsx`, `src/pages/HistoryPage.tsx`, `src/pages/WorkoutDetailPage.tsx`, `src/pages/WeeklySetsTrackerPage.tsx`, `src/pages/TemplateEditorPage.tsx`, `src/pages/workout/workoutPageHelpers.ts`

**Problem**: default exercises plus user overrides plus custom exercises is repeated across many Modules. The `default-` identifier convention leaks into callers, making the Interface Shallow. The deletion test shows poor Locality: deleting one copy of the merge logic only moves the same rule elsewhere.

**Solution**: Deepen an exercise catalog Module that owns merged exercise lookup, default/custom classification, override behavior, and deleted exercise fallback.

**Benefits**: More Locality for exercise identity rules. More Leverage because every caller gets the same catalog behavior from one Interface, and tests can cover default override and deleted-history behavior once.

5. **Exercise selection flow Module**

**Files**: `src/App.tsx`, `src/pages/ExerciseSelectorPage.tsx`, `src/pages/ExerciseFormPage.tsx`, `src/pages/TemplateEditorPage.tsx`, `src/pages/WorkoutPage.tsx`, `src/pages/MuscleGroupSelectorPage.tsx`

**Problem**: The selector Interface is implicit route state: `selectedExerciseId`, `replacementWorkoutExerciseId`, `templateUpdateChecked`, saved exercise state, append flags, selection targets, and draft state. This creates a leaky seam where several Modules must preserve the same protocol.

**Solution**: Deepen an exercise selection flow Module that owns the protocol for opening selection, creating an exercise mid-flow, returning selection, preserving drafts, and carrying template-update choices.

**Benefits**: More Locality for navigation-state behavior. More Leverage for tests because selection flows can be verified through one Interface instead of many route-specific page tests.

6. **Training history analytics Module**

**Files**: `src/pages/HistoryPage.tsx`, `src/pages/ExerciseHistoryPage.tsx`, `src/pages/WorkoutDetailPage.tsx`, `src/pages/WeeklySetsTrackerPage.tsx`, `src/utils/storage.ts`, `docs/TODO.md`

**Problem**: Volume, completed set counts, weekly muscle group totals, date grouping, duration display, and exercise history summaries are scattered across page Modules. `docs/TODO.md` already anticipates richer analytics and notes repeated reduction logic.

**Solution**: Deepen a training history analytics Module that owns derived workout facts: volume, completed sets, exercise summaries, weekly muscle group sets, frequency, and progress comparisons.

**Benefits**: More Locality for analytics rules and date handling. More Leverage because future analytics and current pages can reuse the same Interface, while tests focus on derived facts rather than display setup.

7. **Application dialog Module**

**Files**: `src/hooks/useConfirmDialog.ts`, `src/hooks/useAppDialog.tsx`, `src/hooks/appDialogContext.ts`, `src/pages/WorkoutPage.tsx`, `src/pages/TemplatesPage.tsx`, `src/pages/HistoryPage.tsx`

**Problem**: There are two overlapping dialog Implementations: local callback-based confirmation and global promise-based application dialog. The seam is unclear, so new Modules have to choose between duplicate Interfaces.

**Solution**: Deepen the existing application dialog Module so confirm and alert behavior have one Interface and one Adapter path through the app shell.

**Benefits**: More Locality for dialog behavior and fewer duplicated tests. More Leverage because pages can use a small promise-based Interface without rendering local dialog state.
