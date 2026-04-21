import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";

import type { Exercise } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { ExerciseFormPage } from "./ExerciseFormPage";

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

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const mockStorage = new MockStorage();

/** Stores a JSON-serializable value in mock localStorage. */
function setLS(key: string, value: unknown): void {
  mockStorage.setItem(key, JSON.stringify(value));
}

/** Reads and parses a JSON value from mock localStorage. */
function getLS<T>(key: string): T | null {
  const raw = mockStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

function createExercise(
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

function RouteStateViewer() {
  const location = useLocation();

  return (
    <div>
      <div data-testid="location-path">{location.pathname}</div>
      <pre data-testid="location-state">{JSON.stringify(location.state ?? null)}</pre>
    </div>
  );
}

function renderExerciseForm(initialEntry: InitialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/workout/select-exercise" element={<RouteStateViewer />} />
        <Route path="/workout/select-exercise/new" element={<ExerciseFormPage />} />
        <Route path="/exercises" element={<RouteStateViewer />} />
        <Route path="/exercises/new" element={<ExerciseFormPage />} />
        <Route path="/exercises/edit/:exerciseId" element={<ExerciseFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

type ExerciseFormInputValues = {
  name: string;
  exerciseType: string;
  muscleGroup: string;
  notes: string;
};

/** Fills the editable exercise form fields with the provided values. */
function fillExerciseForm(inputValues: ExerciseFormInputValues): void {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: inputValues.name } });
  fireEvent.change(screen.getByLabelText("Exercise Type"), {
    target: { value: inputValues.exerciseType },
  });
  fireEvent.change(screen.getByLabelText("Muscle Group"), {
    target: { value: inputValues.muscleGroup },
  });
  fireEvent.change(screen.getByLabelText("Notes"), { target: { value: inputValues.notes } });
}

/** Returns the current route state captured by the test router. */
function getCurrentRouteState<T>(): T {
  return JSON.parse(screen.getByTestId("location-state").textContent ?? "null") as T;
}

describe("ExerciseFormPage", () => {
  beforeEach(() => {
    mockStorage.clear();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    window.ResizeObserver = MockResizeObserver;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("creates a new exercise and returns merged state to the selector", async () => {
    renderExerciseForm({
      pathname: "/workout/select-exercise/new",
      key: "create-exercise",
      state: {
        templateUpdateChecked: true,
        appendTemplateExercise: true,
      },
    });

    fillExerciseForm({
      name: "Cable Row",
      exerciseType: "cable",
      muscleGroup: "back",
      notes: "Lead with elbows",
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/workout/select-exercise");
    });

    expect(
      getCurrentRouteState<{
        templateUpdateChecked: boolean;
        appendTemplateExercise: boolean;
        savedExerciseId: string;
      }>()
    ).toMatchObject({
      templateUpdateChecked: true,
      appendTemplateExercise: true,
      savedExerciseId: expect.any(String),
    });

    expect(getLS<Exercise[]>(STORAGE_KEYS.EXERCISES)).toEqual([
      expect.objectContaining({
        name: "Cable Row",
        muscleGroup: "back",
        exerciseType: "cable",
        notes: "Lead with elbows",
      }),
    ]);
  });

  it("edits a user exercise and returns to the exercises page", async () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({
        id: "exercise-1",
        name: "Chest Press",
        muscleGroup: "chest",
        exerciseType: "machine",
        notes: "Old notes",
      }),
    ]);

    renderExerciseForm({
      pathname: "/exercises/edit/exercise-1",
      key: "edit-exercise",
      state: { ignoredByExercisesReturn: true },
    });

    fillExerciseForm({
      name: "Incline Chest Press",
      exerciseType: "machine-assistance",
      muscleGroup: "shoulders",
      notes: "Controlled tempo",
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/exercises");
    });

    expect(getCurrentRouteState<{ savedExerciseId: string }>()).toEqual({
      savedExerciseId: "exercise-1",
    });
    expect(getLS<Exercise[]>(STORAGE_KEYS.EXERCISES)).toEqual([
      {
        id: "exercise-1",
        name: "Incline Chest Press",
        muscleGroup: "shoulders",
        exerciseType: "machine-assistance",
        notes: "Controlled tempo",
      },
    ]);
  });

  it("saves notes for a default exercise as a user override while keeping base fields locked", async () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({
        id: "default-bench-press-medium-grip",
        name: "Bench Press (Medium Grip)",
        muscleGroup: "chest",
        exerciseType: "barbell",
        notes: "Pause briefly",
      }),
    ]);

    renderExerciseForm({
      pathname: "/workout/select-exercise/new",
      key: "default-override",
      state: {
        fromSelector: true,
        exercise: createExercise({
          id: "default-bench-press-medium-grip",
          name: "Bench Press (Medium Grip)",
          muscleGroup: "chest",
          exerciseType: "barbell",
          notes: "Pause briefly",
        }),
      },
    });

    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Exercise Type") as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText("Muscle Group") as HTMLSelectElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Pause on chest" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/workout/select-exercise");
    });

    expect(getCurrentRouteState<{ fromSelector: boolean; savedExerciseId: string }>()).toMatchObject({
      fromSelector: true,
      savedExerciseId: "default-bench-press-medium-grip",
    });
    expect(getLS<Exercise[]>(STORAGE_KEYS.EXERCISES)).toEqual([
      {
        id: "default-bench-press-medium-grip",
        name: "Bench Press (Medium Grip)",
        muscleGroup: "chest",
        exerciseType: "barbell",
        notes: "Pause on chest",
      },
    ]);
  });

  it("deletes an exercise and returns deletedExerciseId to the parent route", async () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({
        id: "exercise-2",
        name: "Hammer Curl",
        muscleGroup: "biceps",
      }),
      createExercise({
        id: "exercise-press",
        name: "Machine Press",
        muscleGroup: "chest",
      }),
    ]);
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, {
      id: "active-workout",
      name: "Upper",
      date: "2026-04-17T10:00:00.000Z",
      startTime: "2026-04-17T09:00:00.000Z",
      completed: false,
      exercises: [
        {
          id: "active-curl",
          exerciseId: "exercise-2",
          intensityTechnique: "super-set",
          supersetGroupId: "pair-1",
          sets: [{ id: "set-1", weight: 30, reps: 10, completed: true }],
        },
        {
          id: "active-press",
          exerciseId: "exercise-press",
          intensityTechnique: "super-set",
          supersetGroupId: "pair-1",
          sets: [{ id: "set-2", weight: 80, reps: 8, completed: true }],
        },
      ],
    });
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Arms",
        muscleGroups: [
          {
            id: "group-biceps",
            muscleGroup: "biceps",
            exercises: [
              {
                id: "template-curl",
                exerciseId: "exercise-2",
                setCount: 3,
                intensityTechnique: "super-set",
                supersetGroupId: "pair-2",
              },
            ],
          },
          {
            id: "group-chest",
            muscleGroup: "chest",
            exercises: [
              {
                id: "template-press",
                exerciseId: "exercise-press",
                setCount: 3,
                intensityTechnique: "super-set",
                supersetGroupId: "pair-2",
              },
            ],
          },
        ],
      },
    ]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      {
        id: "completed-workout",
        name: "Arms",
        date: "2026-04-16T10:00:00.000Z",
        startTime: "2026-04-16T09:00:00.000Z",
        completed: true,
        exercises: [
          {
            id: "history-curl",
            exerciseId: "exercise-2",
            sets: [{ id: "history-set-1", weight: 25, reps: 12, completed: true }],
          },
        ],
      },
    ]);

    renderExerciseForm({
      pathname: "/workout/select-exercise/new",
      key: "delete-exercise",
      state: {
        templateUpdateChecked: false,
        exercise: createExercise({
          id: "exercise-2",
          name: "Hammer Curl",
          muscleGroup: "biceps",
        }),
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /delete exercise/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/workout/select-exercise");
    });

    expect(
      getCurrentRouteState<{ templateUpdateChecked: boolean; deletedExerciseId: string }>()
    ).toMatchObject({
      templateUpdateChecked: false,
      deletedExerciseId: "exercise-2",
    });
    expect(getLS<Exercise[]>(STORAGE_KEYS.EXERCISES)).toEqual([
      expect.objectContaining({ id: "exercise-press" }),
    ]);
    const activeWorkout = getLS<{ exercises: Array<Record<string, unknown>> }>(
      STORAGE_KEYS.ACTIVE_WORKOUT
    );
    expect(activeWorkout).toMatchObject({
      exercises: [
        {
          id: "active-press",
          exerciseId: "exercise-press",
        },
      ],
    });
    expect(activeWorkout?.exercises[0]).not.toHaveProperty("intensityTechnique");
    expect(activeWorkout?.exercises[0]).not.toHaveProperty("supersetGroupId");
    expect(getLS(STORAGE_KEYS.TEMPLATES)).toEqual([
      {
        id: "template-1",
        name: "Arms",
        muscleGroups: [
          {
            id: "group-chest",
            muscleGroup: "chest",
            exercises: [
              {
                id: "template-press",
                exerciseId: "exercise-press",
                setCount: 3,
              },
            ],
          },
        ],
      },
    ]);
    const templates = getLS<{
      muscleGroups: Array<{ exercises: Array<Record<string, unknown>> }>;
    }[]>(STORAGE_KEYS.TEMPLATES);
    expect(templates?.[0].muscleGroups[0].exercises[0]).not.toHaveProperty("intensityTechnique");
    expect(templates?.[0].muscleGroups[0].exercises[0]).not.toHaveProperty("supersetGroupId");
    expect(getLS(STORAGE_KEYS.WORKOUTS)).toEqual([
      expect.objectContaining({
        id: "completed-workout",
        exercises: [
          expect.objectContaining({
            id: "history-curl",
            exerciseId: "exercise-2",
            exerciseSnapshot: expect.objectContaining({
              id: "exercise-2",
              name: "Hammer Curl",
            }),
          }),
        ],
      }),
    ]);
  });
});
