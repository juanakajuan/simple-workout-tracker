import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";

import type { Exercise, Workout } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { WorkoutDetailPage } from "./WorkoutDetailPage";

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

function setLS(key: string, value: unknown) {
  mockStorage.setItem(key, JSON.stringify(value));
}

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
    exerciseType: overrides.exerciseType ?? "cable",
    notes: overrides.notes ?? "",
  };
}

function createWorkout(overrides: Partial<Workout> & Pick<Workout, "id" | "name">): Workout {
  return {
    id: overrides.id,
    name: overrides.name,
    date: overrides.date ?? "2026-04-08T10:00:00.000Z",
    startTime: overrides.startTime ?? "2026-04-08T09:00:00.000Z",
    completed: overrides.completed ?? true,
    exercises: overrides.exercises ?? [],
    duration: overrides.duration,
    templateId: overrides.templateId,
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

function WorkoutDetailRoute() {
  return (
    <>
      <WorkoutDetailPage />
      <RouteStateViewer />
    </>
  );
}

function renderWorkoutDetailPage(initialEntries: InitialEntry[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route path="/history" element={<RouteStateViewer />} />
        <Route path="/history/workout/:workoutId" element={<WorkoutDetailRoute />} />
        <Route
          path="/history/workout/:workoutId/exercise/:exerciseId"
          element={<RouteStateViewer />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("WorkoutDetailPage", () => {
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

  it("navigates back when the workout is missing", async () => {
    renderWorkoutDetailPage(["/history", "/history/workout/missing-workout"]);

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/history");
    });
  });

  it("renames the workout from the kebab menu and persists it", async () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({ id: "exercise-row", name: "Cable Row", muscleGroup: "back" }),
    ]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "workout-1",
        name: "Upper A",
        exercises: [
          {
            id: "workout-exercise-1",
            exerciseId: "exercise-row",
            sets: [{ id: "set-1", weight: 100, reps: 8, completed: true }],
          },
        ],
      }),
    ]);

    renderWorkoutDetailPage(["/history", "/history/workout/workout-1"]);

    fireEvent.click(screen.getByRole("button", { name: /more options/i }));
    fireEvent.click(screen.getByRole("button", { name: /rename workout/i }));

    const input = screen.getByLabelText(/workout name/i);
    fireEvent.change(input, { target: { value: "Upper B" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Upper B" })).toBeDefined();
    });

    expect(getLS<Workout[]>(STORAGE_KEYS.WORKOUTS)).toEqual([
      expect.objectContaining({ id: "workout-1", name: "Upper B" }),
    ]);
  });

  it("hands delete off to history through location state", async () => {
    setLS(STORAGE_KEYS.WORKOUTS, [createWorkout({ id: "workout-1", name: "Upper A" })]);

    renderWorkoutDetailPage(["/history", "/history/workout/workout-1"]);

    fireEvent.click(screen.getByRole("button", { name: /more options/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete workout/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/history");
    });

    expect(JSON.parse(screen.getByTestId("location-state").textContent ?? "null")).toEqual({
      deleteWorkoutId: "workout-1",
    });
  });

  it("renders intensity tags for logged exercises", () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({ id: "exercise-row", name: "Cable Row", muscleGroup: "back" }),
      createExercise({ id: "exercise-press", name: "Machine Press", muscleGroup: "chest" }),
    ]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "workout-1",
        name: "Upper A",
        exercises: [
          {
            id: "workout-exercise-1",
            exerciseId: "exercise-row",
            intensityTechnique: "drop-set",
            sets: [{ id: "set-1", weight: 100, reps: 8, completed: true }],
          },
          {
            id: "workout-exercise-2",
            exerciseId: "exercise-press",
            intensityTechnique: "super-set",
            supersetGroupId: "superset-1",
            sets: [{ id: "set-2", weight: 80, reps: 10, completed: true }],
          },
        ],
      }),
    ]);

    renderWorkoutDetailPage(["/history", "/history/workout/workout-1"]);

    expect(screen.getByText("Drop Set")).toBeDefined();
    expect(screen.getByText("Superset 1")).toBeDefined();
  });

  it("closes the menu when clicking outside of it", async () => {
    setLS(STORAGE_KEYS.WORKOUTS, [createWorkout({ id: "workout-1", name: "Upper A" })]);

    renderWorkoutDetailPage(["/history", "/history/workout/workout-1"]);

    fireEvent.click(screen.getByRole("button", { name: /more options/i }));
    expect(screen.getByRole("button", { name: /rename workout/i })).toBeDefined();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /rename workout/i })).toBeNull();
    });
  });

  it("navigates to the exercise detail page when an exercise name is clicked", async () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({ id: "exercise-row", name: "Cable Row", muscleGroup: "back" }),
    ]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "workout-1",
        name: "Upper A",
        exercises: [
          {
            id: "workout-exercise-1",
            exerciseId: "exercise-row",
            sets: [{ id: "set-1", weight: 100, reps: 8, completed: true }],
          },
        ],
      }),
    ]);

    renderWorkoutDetailPage(["/history", "/history/workout/workout-1"]);

    fireEvent.click(screen.getByText("Cable Row"));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe(
        "/history/workout/workout-1/exercise/exercise-row"
      );
    });
  });

  it("renders deleted historical exercises from the stored snapshot", () => {
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "workout-1",
        name: "Upper A",
        exercises: [
          {
            id: "workout-exercise-1",
            exerciseId: "deleted-row",
            exerciseSnapshot: createExercise({
              id: "deleted-row",
              name: "Cable Row",
              muscleGroup: "back",
            }),
            sets: [{ id: "set-1", weight: 100, reps: 8, completed: true }],
          },
        ],
      }),
    ]);

    renderWorkoutDetailPage(["/history", "/history/workout/workout-1"]);

    expect(screen.getByText("Cable Row")).toBeDefined();
    expect(screen.getByText("Back")).toBeDefined();
  });
});
