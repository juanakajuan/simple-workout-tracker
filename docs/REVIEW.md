# Code Review

## Findings

- [x] High: Starting a template can silently destroy an in-progress workout.

  `src/pages/TemplatesPage.tsx:98-130` always creates a new workout and writes it to `ACTIVE_WORKOUT`, and the start-confirm UI at `src/pages/TemplatesPage.tsx:199-206` does not check for an existing active session first. If the user already has a workout in progress, tapping Start replaces it with no warning.

- [x] High: Unsaved edits are lost when editing an existing template and hopping to the exercise picker.

  In `src/pages/TemplateEditorPage.tsx:146-163`, edit mode initializes local state from the stored template; in `src/pages/TemplateEditorPage.tsx:180-184`, draft persistence only runs for new templates; and `src/pages/TemplateEditorPage.tsx:273-315` navigates away to child routes for add/replace flows. Result: name/order/set-count edits made in edit mode disappear after returning from `/select-exercise`.

- [x] Medium: Adding an exercise to a template-backed workout can rewrite template order incorrectly.

  `src/pages/WorkoutPage.tsx:692-744` appends the new exercise to the first matching muscle-group bucket in the template, while the caller at `src/pages/WorkoutPage.tsx:892-898` does not pass the actual insertion position from the workout. If the user adds, for example, Chest after Back, the saved template becomes grouped as Chest/Chest/Back on the next run.

- [ ] Medium: `ConfirmDialog` checkbox state leaks across openings.

  `src/components/ConfirmDialog.tsx:31` seeds `checkboxChecked` from `checkboxDefaultChecked` only once, and the state is never reset when a new dialog opens. The checkbox rendered at `src/components/ConfirmDialog.tsx:67-73` can therefore retain a previous user toggle and submit the wrong value for later confirmations.

- [ ] Medium: Active-workout validation is effectively disabled.

  `src/utils/storage.ts:234-238` returns `value as Workout` with no shape checks, and that same no-op normalization is used when reading storage/import data at `src/utils/storage.ts:349-355` and `src/utils/storage.ts:582-585`. A malformed backup or corrupted localStorage entry can pass through as a "valid" workout and then break consumers that assume `exercises`, `date`, and `startTime` exist.

- [ ] Low/Medium: Overnight workouts are attributed to the start date, not the finish date.

  `src/pages/WorkoutPage.tsx:445-460` finishes the workout without updating `date`, while history and weekly analytics group by that field in `src/pages/HistoryPage.tsx:48-66`, `src/pages/HistoryPage.tsx:153-166`, and `src/pages/WeeklySetsTrackerPage.tsx:121-128`. A session that crosses midnight or a week boundary will show up under the previous day/week.
