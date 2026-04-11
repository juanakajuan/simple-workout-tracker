# Test Coverage Checklist

## Highest Priority

- [x] `src/pages/TemplateEditorPage.tsx`
      Reducer-driven template editing, draft persistence, selection return state, and template rebuild logic.
- [x] `src/pages/ExerciseSelectorPage.tsx`
      Search/filter/grouping plus replacement/template-update navigation flows.
- [x] `src/pages/MorePage.tsx`
      Destructive import/export flow, active-workout warning, file selection, and reload behavior.
- [x] `src/pages/WeeklySetsTrackerPage.tsx`
      Week-boundary math, rolling 8-week aggregation, and ordering logic.
- [x] `src/hooks/useLocalStorage.ts`
      Deserialization failures, functional updates, and cross-tab `storage` sync.
- [x] `src/components/SetRow.tsx`
      Completion rules, skip/unskip behavior, delete rules, and bodyweight vs weighted input states.

## High Priority

- [x] `src/pages/WorkoutPage.tsx`
      Starting workouts, adding/removing/reordering exercises, set count changes, auto-match weight, note editing, selector return-state handling, template updates, finish/cancel branches, and plate calculator edge cases.
- [x] `src/utils/storage.ts`
      Local storage reads/writes, malformed JSON handling, template normalization, draft normalization, active workout normalization, relative-date helpers, export/import validation, and rollback on failed import.
- [x] `src/pages/TemplatesPage.tsx`
      Draft banner behavior, discard-confirm flows, template stats, template start flow, and delete/edit kebab actions.
- [x] `src/pages/ExerciseFormPage.tsx`
      Create vs edit flows, default-exercise override behavior, delete behavior, and return-state navigation.
- [x] `src/pages/ExercisesPage.tsx`
      Default-plus-user exercise merge, search, muscle filtering, grouping, and navigation to create/edit/history.
- [x] `src/pages/HistoryPage.tsx`
      Grouping by month, workout stats, duration formatting, delete flow from location state, and navigation to detail/tracker pages.
- [x] `src/pages/WorkoutDetailPage.tsx`
      Missing-workout fallback, rename flow, delete handoff back to history, outside-click menu close, and exercise detail navigation.
- [x] `src/pages/ExerciseHistoryPage.tsx`
      Missing-exercise fallback, per-workout volume math, total sets/volume, and date labels.
- [x] `src/hooks/useAppDialog.tsx`
      Promise-based alert/confirm flow, replacement of an already-open dialog, and resolve behavior.
- [x] `src/components/ConfirmDialog.tsx`
      Escape handling, overlay click cancel, checkbox handling, confirm/cancel sequencing, and body-scroll lock cleanup.
- [x] `src/components/AlertDialog.tsx`
      Escape/Enter handling, overlay close, variant rendering, and body-scroll lock cleanup.
- [x] `src/components/BottomTabBar.tsx`
      Last-subroute restore behavior, active-tab navigation, and scroll-to-top behavior.

## Medium Priority

- [x] `src/pages/MuscleGroupSelectorPage.tsx`
      Toggle selection, select-all/deselect-all, touch vs click deduplication, already-added badge, and confirm navigation state.
- [x] `src/components/WorkoutTimer.tsx`
      Initial elapsed-time calculation, ticking, formatting, and interval cleanup.
- [x] `src/components/ExerciseCard.tsx`
      Edit menu open/close, click propagation rules, default badge, and last-performed rendering.
- [x] `src/pages/SettingsPage.tsx`
      Settings persistence and toggle behavior.
- [x] `src/hooks/useConfirmDialog.ts`
      Local dialog open/close state and option forwarding.
- [x] `src/hooks/useAutoFitText.ts`
      Font shrinking, resize behavior, minimum font-size rules, and empty-text handling.
- [x] `src/hooks/appDialogContext.ts`
      Guard that throws when used outside the provider.
- [x] `src/components/PageHeader.tsx`
      Back navigation, optional custom back handler, and string vs custom-node title rendering.
- [x] `src/App.tsx`
      Route coverage for all page paths and redirect from `/`.
- [x] `src/main.tsx`
      App bootstrap rendering.
- [x] `src/utils/appRelease.ts`
      Build timestamp formatting, unseen-build detection, and seen-build persistence.
- [x] `vite.config.ts`
      Build ID generation and git SHA fallback behavior.

## Low Priority

- [x] `src/components/ToggleSwitch.tsx`
      Click and keyboard toggling plus disabled behavior.
- [x] `src/components/DraftBanner.tsx`
      Continue vs dismiss click propagation.
- [x] `src/components/Tag.tsx`
      Variant and muscle-group class selection.
- [x] `src/types/index.ts`
      Label/color lookup consistency and `getMuscleGroupClassName` output.
- [x] `src/data/defaultExercises.ts`
      Aggregation of all built-in exercise lists.
- [x] `src/data/exercises/abs.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/back.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/biceps.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/calves.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/chest.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/forearms.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/glutes.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/hamstrings.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/quads.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [x] `src/data/exercises/shoulders.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/traps.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/triceps.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
