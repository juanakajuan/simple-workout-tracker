# Test Coverage Checklist

## Highest Priority

- [x] `src/pages/TemplateEditorPage.tsx`
      Reducer-driven template editing, draft persistence, selection return state, and template rebuild logic.
- [ ] `src/pages/ExerciseSelectorPage.tsx`
      Search/filter/grouping plus replacement/template-update navigation flows.
- [ ] `src/pages/MorePage.tsx`
      Destructive import/export flow, active-workout warning, file selection, and reload behavior.
- [ ] `src/pages/WeeklySetsTrackerPage.tsx`
      Week-boundary math, rolling 8-week aggregation, and ordering logic.
- [ ] `src/hooks/useLocalStorage.ts`
      Deserialization failures, functional updates, and cross-tab `storage` sync.
- [ ] `src/components/SetRow.tsx`
      Completion rules, skip/unskip behavior, delete rules, and bodyweight vs weighted input states.

## High Priority

- [ ] `src/pages/WorkoutPage.tsx`
      Starting workouts, adding/removing/reordering exercises, set count changes, auto-match weight, note editing, selector return-state handling, template updates, finish/cancel branches, and plate calculator edge cases.
- [ ] `src/utils/storage.ts`
      Local storage reads/writes, malformed JSON handling, template normalization, draft normalization, active workout normalization, relative-date helpers, export/import validation, and rollback on failed import.
- [ ] `src/pages/TemplatesPage.tsx`
      Draft banner behavior, discard-confirm flows, template stats, template start flow, and delete/edit kebab actions.
- [ ] `src/pages/ExerciseFormPage.tsx`
      Create vs edit flows, default-exercise override behavior, delete behavior, and return-state navigation.
- [ ] `src/pages/ExercisesPage.tsx`
      Default-plus-user exercise merge, search, muscle filtering, grouping, and navigation to create/edit/history.
- [ ] `src/pages/HistoryPage.tsx`
      Grouping by month, workout stats, duration formatting, delete flow from location state, and navigation to detail/tracker pages.
- [ ] `src/pages/WorkoutDetailPage.tsx`
      Missing-workout fallback, rename flow, delete handoff back to history, outside-click menu close, and exercise detail navigation.
- [ ] `src/pages/ExerciseHistoryPage.tsx`
      Missing-exercise fallback, per-workout volume math, total sets/volume, and date labels.
- [ ] `src/hooks/useAppDialog.tsx`
      Promise-based alert/confirm flow, replacement of an already-open dialog, and resolve behavior.
- [ ] `src/components/ConfirmDialog.tsx`
      Escape handling, overlay click cancel, checkbox handling, confirm/cancel sequencing, and body-scroll lock cleanup.
- [ ] `src/components/AlertDialog.tsx`
      Escape/Enter handling, overlay close, variant rendering, and body-scroll lock cleanup.
- [ ] `src/components/BottomTabBar.tsx`
      Last-subroute restore behavior, active-tab navigation, and scroll-to-top behavior.

## Medium Priority

- [ ] `src/pages/MuscleGroupSelectorPage.tsx`
      Toggle selection, select-all/deselect-all, touch vs click deduplication, already-added badge, and confirm navigation state.
- [ ] `src/components/WorkoutTimer.tsx`
      Initial elapsed-time calculation, ticking, formatting, and interval cleanup.
- [ ] `src/components/ExerciseCard.tsx`
      Edit menu open/close, click propagation rules, default badge, and last-performed rendering.
- [ ] `src/pages/SettingsPage.tsx`
      Settings persistence and toggle behavior.
- [ ] `src/hooks/useConfirmDialog.ts`
      Local dialog open/close state and option forwarding.
- [ ] `src/hooks/useAutoFitText.ts`
      Font shrinking, resize behavior, minimum font-size rules, and empty-text handling.
- [ ] `src/hooks/appDialogContext.ts`
      Guard that throws when used outside the provider.
- [ ] `src/components/PageHeader.tsx`
      Back navigation, optional custom back handler, and string vs custom-node title rendering.
- [ ] `src/App.tsx`
      Route coverage for all page paths and redirect from `/`.
- [ ] `src/main.tsx`
      App bootstrap rendering.
- [ ] `src/utils/appRelease.ts`
      Build timestamp formatting, unseen-build detection, and seen-build persistence.
- [ ] `vite.config.ts`
      Build ID generation and git SHA fallback behavior.

## Low Priority

- [ ] `src/components/ToggleSwitch.tsx`
      Click and keyboard toggling plus disabled behavior.
- [ ] `src/components/DraftBanner.tsx`
      Continue vs dismiss click propagation.
- [ ] `src/components/Tag.tsx`
      Variant and muscle-group class selection.
- [ ] `src/types/index.ts`
      Label/color lookup consistency and `getMuscleGroupClassName` output.
- [ ] `src/data/defaultExercises.ts`
      Aggregation of all built-in exercise lists.
- [ ] `src/data/exercises/abs.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/back.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/biceps.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/calves.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/chest.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/forearms.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/glutes.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/hamstrings.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/quads.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/shoulders.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/traps.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
- [ ] `src/data/exercises/triceps.ts`
      Static fixture sanity checks: valid shape, expected IDs, and correct muscle group.
