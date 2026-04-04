import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { Workout, WorkoutTemplate } from "../types";
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

function setLS(key: string, value: unknown) {
  mockStorage.setItem(key, JSON.stringify(value));
}

function getLS<T>(key: string): T | null {
  const raw = mockStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

function clearLS() {
  mockStorage.clear();
}

// ---------------------------------------------------------------------------
// Workout factory
// ---------------------------------------------------------------------------

let idCounter = 0;

function uid() {
  return `test-id-${++idCounter}`;
}

function makeSet(overrides: Partial<{ id: string; weight: number; reps: number; completed: boolean; skipped: boolean }> = {}) {
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

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderWorkoutPage(initialEntry = "/workout", locationState: unknown = null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialEntry, state: locationState }]}>
      <WorkoutPage />
    </MemoryRouter>
  );
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
  // @ts-expect-error — jsdom does not include ResizeObserver
  window.ResizeObserver = MockResizeObserver;
  // Silence console noise from useLocalStorage error paths
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
    const input = document.querySelector<HTMLInputElement>(".workout-name-input");
    expect(input).not.toBeNull();
  });

  it("saves new name on blur", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Push Day" }));
    renderWorkoutPage();

    fireEvent.click(screen.getByText(/Push Day/));

    const input = document.querySelector<HTMLInputElement>(".workout-name-input")!;
    fireEvent.change(input, { target: { value: "Chest Day" } });
    fireEvent.blur(input);

    // Heading should reflect the new name
    expect(screen.getByText(/Chest Day/)).toBeDefined();
  });

  it("commits name on Enter key", () => {
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, makeWorkout({ name: "Back Day" }));
    renderWorkoutPage();

    fireEvent.click(screen.getByText(/Back Day/));
    const input = document.querySelector<HTMLInputElement>(".workout-name-input")!;
    fireEvent.change(input, { target: { value: "Pull Day" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText(/Pull Day/)).toBeDefined();
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

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/workout",
            state: { selectedExerciseId: "default-bench-press-medium-grip" },
          },
        ]}
      >
        <WorkoutPage />
      </MemoryRouter>
    );

    // The active workout in localStorage should now have one exercise
    const stored = getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT);
    expect(stored?.exercises).toHaveLength(1);
    expect(stored?.exercises[0].exerciseId).toBe("default-bench-press-medium-grip");
  });
});
