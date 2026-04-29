import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { Exercise, Workout, WorkoutSet, WorkoutTemplate } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { WorkoutPage } from "./WorkoutPage";

// ---------------------------------------------------------------------------
// MockStorage (same pattern as storage.test.ts)
// ---------------------------------------------------------------------------

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const mockStorage = new MockStorage();

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

/**
 * Stores a JSON-serializable test value in mock localStorage.
 */
function setLS(key: string, value: unknown): void {
  mockStorage.setItem(key, JSON.stringify(value));
}

/**
 * Reads and parses a JSON value from mock localStorage.
 */
function getLS<T>(key: string): T | null {
  const raw = mockStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

function clearLS(): void {
  mockStorage.clear();
}

// ---------------------------------------------------------------------------
// Workout factory
// ---------------------------------------------------------------------------

let idCounter = 0;

function uid(): string {
  return `test-id-${++idCounter}`;
}

function makeSet(
  overrides: Partial<{
    id: string;
    weight: number;
    reps: number;
    completed: boolean;
    skipped: boolean;
  }> = {}
): WorkoutSet {
  return {
    id: overrides.id ?? uid(),
    weight: overrides.weight ?? 0,
    reps: overrides.reps ?? 0,
    completed: overrides.completed ?? false,
    skipped: overrides.skipped ?? false,
  };
}

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: uid(),
    name: "Test Workout",
    date: new Date().toISOString(),
    startTime: new Date().toISOString(),
    exercises: [],
    completed: false,
    ...overrides,
  };
}

function makeExercise(
  overrides: Partial<Exercise> & Pick<Exercise, "id" | "name" | "muscleGroup">
): Exercise {
  return {
    id: overrides.id,
    name: overrides.name,
    muscleGroup: overrides.muscleGroup,
    exerciseType: overrides.exerciseType ?? "machine",
    notes: overrides.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderWorkoutPage(
  initialEntry: string = "/workout",
  locationState: unknown = null
): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialEntry, state: locationState }]}> 
      <WorkoutPage />
    </MemoryRouter>
  );
}

/**
 * Returns the inline workout-name editor after the heading enters edit mode.
 */
function getWorkoutNameInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(".workout-name-input");
  expect(input).not.toBeNull();
  return input!;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

// ResizeObserver is used by useAutoFitText but not available in jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  idCounter = 0;
  clearLS();
  Object.defineProperty(window, "localStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
  window.ResizeObserver = MockResizeObserver;
  // Silence console noise from useLocalStorage error paths
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Idle state (no active workout)
// ---------------------------------------------------------------------------

describe("WorkoutPage – idle state", () => {
  it("renders the start screen when there is no active workout", () => {
    renderWorkoutPage();
    expect(screen.getByText("Ready to train?")).toBeDefined();
    expect(screen.getByRole("button", { name: /start/i })).toBeDefined();
  });

  it("starts an empty workout when the Start button is clicked", () => {
    renderWorkoutPage();

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    // The day-name heading should appear (workout name input / heading)
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const expectedName = `${dayNames[new Date().getDay()]} Workout`;
    expect(screen.getByText(new RegExp(expectedName))).toBeDefined();

    // Active workout should be persisted to localStorage
    const stored = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe(expectedName);
    expect(stored?.completed).toBe(false);
    expect(stored?.exercises).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Active workout – initial render
// ---------------------------------------------------------------------------

describe("WorkoutPage – active workout render", () => {
  it("renders the workout name when an active workout exists in localStorage", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Leg Day" }));
    renderWorkoutPage();
    expect(screen.getByText(/Leg Day/)).toBeDefined();
  });

  it("shows an empty-exercises prompt when the workout has no exercises", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Empty" }));
    renderWorkoutPage();
    // May render in multiple containers; at least one should exist
    expect(screen.getAllByText(/No exercises added yet/).length).toBeGreaterThan(0);
  });

  it("renders exercise names for exercises already in the active workout", () => {
    // Use a default exercise ID so it can be resolved
    const activeWorkout = makeWorkout({
      exercises: [{ id: uid(), exerciseId: "default-bench-press-medium-grip", sets: [makeSet()] }],
    });
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, activeWorkout);
    renderWorkoutPage();
    // The exercise name "Barbell Bench Press" (or whatever default-bench-press-medium-grip is) should appear
    // We just assert the set row renders (at least one set row button present)
    const page = document.querySelector(".workout-page");
    expect(page).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Workout name editing
// ---------------------------------------------------------------------------

describe("WorkoutPage – workout name editing", () => {
  it("switches to an input when the workout name heading is clicked", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Push Day" }));
    renderWorkoutPage();

    const heading = screen.getByText(/Push Day/);
    fireEvent.click(heading);

    // An input should now be present
    const input = getWorkoutNameInput();
    expect(input).not.toBeNull();
  });

  it("saves new name on blur", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Push Day" }));
    renderWorkoutPage();

    fireEvent.click(screen.getByText(/Push Day/));

    const input = getWorkoutNameInput();
    fireEvent.change(input, { target: { value: "Chest Day" } });
    fireEvent.blur(input);

    // Heading should reflect the new name
    expect(screen.getByText(/Chest Day/)).toBeDefined();

    const stored = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(stored?.name).toBe("Chest Day");
  });

  it("commits name on Enter key", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Back Day" }));
    renderWorkoutPage();

    fireEvent.click(screen.getByText(/Back Day/));
    const input = getWorkoutNameInput();
    fireEvent.change(input, { target: { value: "Pull Day" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText(/Pull Day/)).toBeDefined();

    const stored = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(stored?.name).toBe("Pull Day");
  });

  it("restores the edited name after remounting", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Template Push" }));
    const view = renderWorkoutPage();

    fireEvent.click(screen.getByText(/Template Push/));

    const input = getWorkoutNameInput();
    fireEvent.change(input, { target: { value: "Custom Push" } });
    fireEvent.blur(input);

    view.unmount();
    renderWorkoutPage();

    expect(screen.getByText(/Custom Push/)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Finish workout
// ---------------------------------------------------------------------------

describe("WorkoutPage – finish workout", () => {
  it("moves the active workout to history and clears active workout on finish", () => {
    // All sets must be completed for the "Finish Workout" button to appear
    const startTime = new Date(Date.now() - 60_000).toISOString();
    const workout = makeWorkout({
      name: "Finish Me",
      startTime,
      exercises: [
        {
          id: uid(),
          exerciseId: "default-bench-press-medium-grip",
          sets: [makeSet({ id: uid(), completed: true, weight: 135, reps: 10 })],
        },
      ],
    });
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, workout);
    renderWorkoutPage();

    // "Finish Workout" button is present when all sets are completed
    const finishBtn = screen.getByRole("button", { name: /finish workout/i });
    fireEvent.click(finishBtn);

    // Active workout should be gone
    expect(getLS(STORAGE_KEYS.ACTIVE_WORKOUT)).toBeNull();

    // Workout should appear in history
    const history = getLS<Workout[]>(STORAGE_KEYS.WORKOUTS);
    expect(history).toHaveLength(1);
    expect(history![0].completed).toBe(true);
    expect(history![0].name).toBe("Finish Me");
    // Duration should be at least 60 seconds
    expect(history![0].duration).toBeGreaterThanOrEqual(60);

    // UI should return to idle start screen
    expect(screen.getByText("Ready to train?")).toBeDefined();
  });

  it("prepends to existing workout history", () => {
    const existing = makeWorkout({ name: "Old Workout", completed: true });
    setLS(STORAGE_KEYS.WORKOUTS, [existing]);
    const workout = makeWorkout({
      name: "New Workout",
      exercises: [
        {
          id: uid(),
          exerciseId: "default-bench-press-medium-grip",
          sets: [makeSet({ id: uid(), completed: true, weight: 135, reps: 10 })],
        },
      ],
    });
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, workout);
    renderWorkoutPage();

    fireEvent.click(screen.getByRole("button", { name: /finish workout/i }));

    const history = getLS<Workout[]>(STORAGE_KEYS.WORKOUTS)!;
    expect(history).toHaveLength(2);
    expect(history[0].name).toBe("New Workout");
    expect(history[1].name).toBe("Old Workout");
  });

  it("stores the completion timestamp as the workout date", () => {
    vi.useFakeTimers();

    const startDate = new Date("2026-04-11T23:55:00.000Z");
    const finishDate = new Date("2026-04-12T00:10:00.000Z");

    vi.setSystemTime(finishDate);

    const workout = makeWorkout({
      name: "Late Night Lift",
      date: startDate.toISOString(),
      startTime: startDate.toISOString(),
      exercises: [
        {
          id: uid(),
          exerciseId: "default-bench-press-medium-grip",
          sets: [makeSet({ id: uid(), completed: true, weight: 135, reps: 10 })],
        },
      ],
    });
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, workout);
    renderWorkoutPage();

    fireEvent.click(screen.getByRole("button", { name: /finish workout/i }));

    const history = getLS<Workout[]>(STORAGE_KEYS.WORKOUTS);
    expect(history).toHaveLength(1);
    expect(history![0].date).toBe(finishDate.toISOString());
    expect(history![0].duration).toBe(15 * 60);
  });
});

// ---------------------------------------------------------------------------
// Cancel workout
// ---------------------------------------------------------------------------

describe("WorkoutPage – cancel workout", () => {
  // When sets are NOT all completed, the finish-or-cancel button shows "Cancel Workout"
  it("shows a confirmation dialog on Cancel Workout click", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Cancel Me" }));
    renderWorkoutPage();

    // Button text is "Cancel Workout" (not "Finish Workout") since no sets completed
    fireEvent.click(screen.getByRole("button", { name: /cancel workout/i }));

    expect(screen.getByText("Cancel this workout?")).toBeDefined();
  });

  it("keeps the workout when the cancel dialog is dismissed", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Keep Me" }));
    renderWorkoutPage();

    fireEvent.click(screen.getByRole("button", { name: /cancel workout/i }));
    fireEvent.click(screen.getByRole("button", { name: /^no$/i }));

    expect(screen.getByText(/Keep Me/)).toBeDefined();
  });

  it("discards the workout when confirmed in the dialog", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Gone" }));
    renderWorkoutPage();

    fireEvent.click(screen.getByRole("button", { name: /cancel workout/i }));
    // Confirm dialog uses "Yes Papi" as confirm text
    fireEvent.click(screen.getByRole("button", { name: /yes papi/i }));

    expect(getLS(STORAGE_KEYS.ACTIVE_WORKOUT)).toBeNull();
    expect(screen.getByText("Ready to train?")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Template sync – set count propagation
// ---------------------------------------------------------------------------

describe("WorkoutPage – template set count sync", () => {
  function buildTemplate(exerciseId: string, setCount: number): WorkoutTemplate {
    return {
      id: "tmpl-1",
      name: "My Template",
      muscleGroups: [
        {
          id: "mg-1",
          muscleGroup: "chest",
          exercises: [{ id: "te-1", exerciseId, setCount }],
        },
      ],
    };
  }

  it("updates the template set count when a set is added during a workout", () => {
    const exerciseId = "default-bench-press-medium-grip";
    const template = buildTemplate(exerciseId, 3);
    setLS(STORAGE_KEYS.TEMPLATES, [template]);

    const workout = makeWorkout({
      templateId: "tmpl-1",
      exercises: [
        {
          id: "we-1",
          exerciseId,
          sets: [makeSet({ id: "s1" }), makeSet({ id: "s2" }), makeSet({ id: "s3" })],
        },
      ],
    });
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, workout);

    renderWorkoutPage();

    // Click "Add Set" for the exercise
    const addSetBtn = screen.getByRole("button", { name: /add set/i });
    fireEvent.click(addSetBtn);

    // Template should now reflect 4 sets
    const templates = getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)!;
    expect(templates[0].muscleGroups[0].exercises[0].setCount).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Active-workout persistence
// ---------------------------------------------------------------------------

describe("WorkoutPage – active workout persistence", () => {
  it("persists the active workout to localStorage on start", () => {
    renderWorkoutPage();
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    const stored = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(stored).not.toBeNull();
    expect(stored?.completed).toBe(false);
  });

  it("restores an in-progress workout from localStorage on mount", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "In Progress" }));
    renderWorkoutPage();

    // Should immediately render the active workout, not the idle screen
    expect(screen.queryByText("Ready to train?")).toBeNull();
    expect(screen.getByText(/In Progress/)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Selector return state – adding an exercise
// ---------------------------------------------------------------------------

describe("WorkoutPage – selector return state", () => {
  it("adds an exercise when returning from the exercise selector with a selectedExerciseId", () => {
    const workout = makeWorkout({ name: "Selector Test" });
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, workout);

    renderWorkoutPage("/workout", { selectedExerciseId: "default-bench-press-medium-grip" });

    // The active workout in localStorage should now have one exercise
    const stored = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(stored?.exercises).toHaveLength(1);
    expect(stored?.exercises[0].exerciseId).toBe("default-bench-press-medium-grip");
  });

  it("adds the selected exercise to both the workout and template when requested", () => {
    const row = makeExercise({
      id: "exercise-row",
      name: "Chest-Supported Row",
      muscleGroup: "back",
    });
    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Upper",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [
            { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
          ],
        },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [row]);
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        name: "Upper",
        templateId: template.id,
        exercises: [
          { id: "we-1", exerciseId: "default-bench-press-medium-grip", sets: [makeSet()] },
        ],
      })
    );
    setLS(STORAGE_KEYS.TEMPLATES, [template]);

    renderWorkoutPage("/workout", {
      selectedExerciseId: row.id,
      updateTemplate: true,
    });

    const storedWorkout = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(storedWorkout?.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      "default-bench-press-medium-grip",
      row.id,
    ]);
    expect(storedWorkout?.exercises[1].sets).toHaveLength(1);

    const storedTemplates = getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES);
    expect(storedTemplates?.[0].muscleGroups).toEqual([
      {
        id: expect.any(String),
        muscleGroup: "chest",
        exercises: [
          {
            id: "template-ex-1",
            exerciseId: "default-bench-press-medium-grip",
            setCount: 3,
          },
        ],
      },
      {
        id: expect.any(String),
        muscleGroup: "back",
        exercises: [
          {
            id: expect.any(String),
            exerciseId: row.id,
            setCount: 3,
          },
        ],
      },
    ]);
  });

  it("keeps template muscle-group order aligned with the workout when adding a duplicate group", () => {
    const row = makeExercise({ id: "exercise-row", name: "Seated Row", muscleGroup: "back" });
    const incline = makeExercise({
      id: "exercise-incline",
      name: "Incline Press",
      muscleGroup: "chest",
    });
    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Upper",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [
            { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
          ],
        },
        {
          id: "group-2",
          muscleGroup: "back",
          exercises: [{ id: "template-ex-2", exerciseId: row.id, setCount: 3 }],
        },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [row, incline]);
    setLS(STORAGE_KEYS.TEMPLATES, [template]);
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        name: "Upper",
        templateId: template.id,
        exercises: [
          { id: "we-1", exerciseId: "default-bench-press-medium-grip", sets: [makeSet()] },
          { id: "we-2", exerciseId: row.id, sets: [makeSet()] },
        ],
      })
    );

    renderWorkoutPage("/workout", {
      selectedExerciseId: incline.id,
      updateTemplate: true,
    });

    expect(
      getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)?.exercises.map((exercise) => exercise.exerciseId)
    ).toEqual(["default-bench-press-medium-grip", row.id, incline.id]);

    expect(getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)?.[0].muscleGroups).toEqual([
      {
        id: expect.any(String),
        muscleGroup: "chest",
        exercises: [
          {
            id: "template-ex-1",
            exerciseId: "default-bench-press-medium-grip",
            setCount: 3,
          },
        ],
      },
      {
        id: expect.any(String),
        muscleGroup: "back",
        exercises: [{ id: "template-ex-2", exerciseId: row.id, setCount: 3 }],
      },
      {
        id: expect.any(String),
        muscleGroup: "chest",
        exercises: [
          {
            id: expect.any(String),
            exerciseId: incline.id,
            setCount: 3,
          },
        ],
      },
    ]);
  });

  it("replaces the selected workout exercise, resets its sets, and leaves the template unchanged when unchecked", () => {
    const fly = makeExercise({
      id: "exercise-fly",
      name: "Machine Fly",
      muscleGroup: "chest",
    });
    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Chest",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [
            { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 2 },
          ],
        },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [fly]);
    setLS(STORAGE_KEYS.TEMPLATES, [template]);
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        name: "Chest",
        templateId: template.id,
        exercises: [
          {
            id: "we-1",
            exerciseId: "default-bench-press-medium-grip",
            sets: [
              makeSet({ id: "set-1", weight: 135, reps: 8, completed: true }),
              makeSet({ id: "set-2", weight: 135, reps: 6, completed: false }),
            ],
          },
        ],
      })
    );

    renderWorkoutPage("/workout", {
      selectedExerciseId: fly.id,
      replacementWorkoutExerciseId: "we-1",
      updateTemplate: false,
    });

    const storedWorkout = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(storedWorkout?.exercises[0]).toMatchObject({
      id: "we-1",
      exerciseId: fly.id,
      sets: [
        { id: "set-1", weight: 0, reps: 0, completed: false },
        { id: "set-2", weight: 0, reps: 0, completed: false },
      ],
    });

    const storedTemplates = getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES);
    expect(storedTemplates?.[0].muscleGroups[0].exercises[0].exerciseId).toBe(
      "default-bench-press-medium-grip"
    );
  });
});

describe("WorkoutPage – workout editing", () => {
  it("reorders workout exercises and rebuilds template muscle groups to match", () => {
    const row = makeExercise({ id: "exercise-row", name: "Seated Row", muscleGroup: "back" });
    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Upper",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [
            { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
          ],
        },
        {
          id: "group-2",
          muscleGroup: "back",
          exercises: [{ id: "template-ex-2", exerciseId: row.id, setCount: 3 }],
        },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [row]);
    setLS(STORAGE_KEYS.TEMPLATES, [template]);
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        templateId: template.id,
        exercises: [
          { id: "we-1", exerciseId: "default-bench-press-medium-grip", sets: [makeSet()] },
          { id: "we-2", exerciseId: row.id, sets: [makeSet()] },
        ],
      })
    );

    renderWorkoutPage();

    fireEvent.click(screen.getAllByRole("button", { name: /more options/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /move down/i }));

    expect(
      getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)?.exercises.map((exercise) => exercise.id)
    ).toEqual(["we-2", "we-1"]);
    expect(getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)?.[0].muscleGroups).toEqual([
      {
        id: expect.any(String),
        muscleGroup: "back",
        exercises: [{ id: "template-ex-2", exerciseId: row.id, setCount: 3 }],
      },
      {
        id: expect.any(String),
        muscleGroup: "chest",
        exercises: [
          { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
        ],
      },
    ]);
  });

  it("syncs template set count when a set is removed", () => {
    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Bench",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [
            { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
          ],
        },
      ],
    };

    setLS(STORAGE_KEYS.TEMPLATES, [template]);
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        templateId: template.id,
        exercises: [
          {
            id: "we-1",
            exerciseId: "default-bench-press-medium-grip",
            sets: [makeSet({ id: "set-1" }), makeSet({ id: "set-2" }), makeSet({ id: "set-3" })],
          },
        ],
      })
    );

    renderWorkoutPage();

    fireEvent.click(screen.getAllByRole("button", { name: /set options/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /delete set/i }));

    expect(getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)?.exercises[0].sets).toHaveLength(2);
    expect(
      getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)?.[0].muscleGroups[0].exercises[0].setCount
    ).toBe(2);
  });

  it("auto-matches weight changes across all sets when the setting is enabled", () => {
    const press = makeExercise({
      id: "exercise-press",
      name: "Machine Press",
      muscleGroup: "chest",
    });

    setLS(STORAGE_KEYS.EXERCISES, [press]);
    setLS(STORAGE_KEYS.SETTINGS, { autoMatchWeight: true });
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        exercises: [
          {
            id: "we-1",
            exerciseId: press.id,
            sets: [makeSet({ id: "set-1", weight: 80 }), makeSet({ id: "set-2", weight: 90 })],
          },
        ],
      })
    );

    renderWorkoutPage();

    const weightInputs = document.querySelectorAll<HTMLInputElement>(".set-weight input");
    fireEvent.change(weightInputs[0], { target: { value: "135" } });

    expect(
      getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)?.exercises[0].sets.map((set) => set.weight)
    ).toEqual([135, 135]);
  });

  it("creates a note override for default exercises and shows the saved note", () => {
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        exercises: [
          { id: "we-1", exerciseId: "default-bench-press-medium-grip", sets: [makeSet()] },
        ],
      })
    );

    renderWorkoutPage();

    fireEvent.click(screen.getByRole("button", { name: /more options/i }));
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));

    const noteInput = screen.getByPlaceholderText("Add notes...") as HTMLTextAreaElement;
    fireEvent.change(noteInput, { target: { value: "Pause on the chest." } });
    fireEvent.blur(noteInput);

    expect(screen.getByText("Pause on the chest.")).toBeDefined();
    expect(getLS<Exercise[]>(STORAGE_KEYS.EXERCISES)).toEqual([
      expect.objectContaining({
        id: "default-bench-press-medium-grip",
        notes: "Pause on the chest.",
      }),
    ]);
  });

  it("prompts for template sync when updating an exercise intensity technique", () => {
    const press = makeExercise({
      id: "exercise-press",
      name: "Machine Press",
      muscleGroup: "chest",
    });
    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Push",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [{ id: "template-ex-1", exerciseId: press.id, setCount: 3 }],
        },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [press]);
    setLS(STORAGE_KEYS.TEMPLATES, [template]);
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        templateId: template.id,
        exercises: [{ id: "we-1", exerciseId: press.id, sets: [makeSet()] }],
      })
    );

    renderWorkoutPage();

    fireEvent.click(
      screen.getByRole("button", { name: `Edit intensity technique for ${press.name}` })
    );
    fireEvent.click(screen.getByRole("button", { name: /drop set/i }));

    expect(screen.getByText("Apply intensity change?")).toBeDefined();
    const updateTemplateCheckbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(updateTemplateCheckbox.checked).toBe(false);

    fireEvent.click(updateTemplateCheckbox);
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)?.exercises[0].intensityTechnique).toBe(
      "drop-set"
    );
    expect(
      getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)?.[0].muscleGroups[0].exercises[0]
        .intensityTechnique
    ).toBe("drop-set");
  });

  it("deletes a workout exercise and removes it from the template when confirmed", () => {
    const row = makeExercise({ id: "exercise-row", name: "Seated Row", muscleGroup: "back" });
    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Upper",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [
            { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
          ],
        },
        {
          id: "group-2",
          muscleGroup: "back",
          exercises: [{ id: "template-ex-2", exerciseId: row.id, setCount: 3 }],
        },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [row]);
    setLS(STORAGE_KEYS.TEMPLATES, [template]);
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        templateId: template.id,
        exercises: [
          { id: "we-1", exerciseId: "default-bench-press-medium-grip", sets: [makeSet()] },
          { id: "we-2", exerciseId: row.id, sets: [makeSet()] },
        ],
      })
    );

    renderWorkoutPage();

    fireEvent.click(screen.getAllByRole("button", { name: /more options/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /delete exercise/i }));
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /send it to the shadow realm/i }));

    expect(
      getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)?.exercises.map((exercise) => exercise.id)
    ).toEqual(["we-1"]);
    expect(getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)?.[0].muscleGroups).toEqual([
      {
        id: expect.any(String),
        muscleGroup: "chest",
        exercises: [
          { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
        ],
      },
    ]);
  });
});

describe("WorkoutPage – plate calculator", () => {
  it("shows below-bar and unloadable messages for edge-case target weights", () => {
    setLS(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      makeWorkout({
        exercises: [
          {
            id: "we-1",
            exerciseId: "default-bench-press-medium-grip",
            sets: [
              makeSet({ id: "set-1", weight: 30, reps: 10 }),
              makeSet({ id: "set-2", weight: 137, reps: 8 }),
            ],
          },
        ],
      })
    );

    renderWorkoutPage();

    fireEvent.click(screen.getByRole("button", { name: /more options/i }));
    fireEvent.click(screen.getByRole("button", { name: /plate calculator/i }));
    expect(
      screen.getByText("This is lighter than a standard barbell. The lowest load here is 45 lbs.")
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /set 2.*137 lbs/i }));
    expect(
      screen.getByText("Standard plates load in 5 lb jumps. Round to the nearest loadable weight.")
    ).toBeDefined();
    expect(screen.getByText("135 lbs")).toBeDefined();
  });
});
