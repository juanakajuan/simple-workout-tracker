import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";

import type { Exercise, Workout } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { ExerciseHistoryPage } from "./ExerciseHistoryPage";

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

function createExercise(
  overrides: Partial<Exercise> & Pick<Exercise, "id" | "name" | "muscleGroup">
): Exercise {
  return {
    id: overrides.id,
    name: overrides.name,
    muscleGroup: overrides.muscleGroup,
    exerciseType: overrides.exerciseType ?? "barbell",
    notes: overrides.notes ?? "",
  };
}

function createWorkout(overrides: Partial<Workout> & Pick<Workout, "id" | "name">): Workout {
  return {
    id: overrides.id,
    name: overrides.name,
    date: overrides.date ?? new Date().toISOString(),
    startTime: overrides.startTime ?? new Date().toISOString(),
    completed: overrides.completed ?? true,
    exercises: overrides.exercises ?? [],
    duration: overrides.duration,
    templateId: overrides.templateId,
  };
}

function RouteStateViewer() {
  const location = useLocation();

  return <div data-testid="location-path">{location.pathname}</div>;
}

function ExerciseHistoryRoute() {
  return (
    <>
      <ExerciseHistoryPage />
      <RouteStateViewer />
    </>
  );
}

function renderExerciseHistoryPage(initialEntries: InitialEntry[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <Routes>
        <Route path="/history" element={<RouteStateViewer />} />
        <Route
          path="/history/workout/:workoutId/exercise/:exerciseId"
          element={<ExerciseHistoryRoute />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ExerciseHistoryPage", () => {
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
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("navigates back when the exercise cannot be found", async () => {
    renderExerciseHistoryPage(["/history", "/history/workout/workout-1/exercise/missing"]);

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/history");
    });
  });

  it("renders workout volumes, totals, and relative date labels", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T12:00:00.000Z"));

    const olderDate = new Date("2026-04-04T09:30:00.000Z");

    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({ id: "exercise-bench", name: "Bench Press", muscleGroup: "chest" }),
    ]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "workout-today",
        name: "Push A",
        date: "2026-04-09T07:00:00.000Z",
        exercises: [
          {
            id: "workout-exercise-1",
            exerciseId: "exercise-bench",
            sets: [
              { id: "set-1", weight: 100, reps: 5, completed: true },
              { id: "set-2", weight: 110, reps: 5, completed: false },
              { id: "set-3", weight: 120, reps: 3, completed: true },
            ],
          },
        ],
      }),
      createWorkout({
        id: "workout-yesterday",
        name: "Push B",
        date: "2026-04-08T07:00:00.000Z",
        exercises: [
          {
            id: "workout-exercise-2",
            exerciseId: "exercise-bench",
            sets: [
              { id: "set-4", weight: 90, reps: 8, completed: true },
              { id: "set-5", weight: 95, reps: 8, completed: true },
            ],
          },
        ],
      }),
      createWorkout({
        id: "workout-older",
        name: "Push C",
        date: olderDate.toISOString(),
        exercises: [
          {
            id: "workout-exercise-3",
            exerciseId: "exercise-bench",
            sets: [{ id: "set-6", weight: 80, reps: 10, completed: true }],
          },
        ],
      }),
      createWorkout({
        id: "workout-incomplete",
        name: "Skipped Session",
        date: "2026-04-10T07:00:00.000Z",
        completed: false,
        exercises: [
          {
            id: "workout-exercise-4",
            exerciseId: "exercise-bench",
            sets: [{ id: "set-7", weight: 200, reps: 1, completed: true }],
          },
        ],
      }),
    ]);

    const { container } = renderExerciseHistoryPage([
      "/history",
      "/history/workout/workout-today/exercise/exercise-bench",
    ]);

    expect(screen.getByText("Today")).toBeDefined();
    expect(screen.getByText("Yesterday")).toBeDefined();
    expect(
      screen.getByText(
        olderDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    ).toBeDefined();
    expect(screen.getByText("860 lbs")).toBeDefined();
    expect(screen.getByText("1,480 lbs")).toBeDefined();
    expect(screen.getByText("800 lbs")).toBeDefined();

    const statValues = Array.from(container.querySelectorAll(".history-stat .stat-value")).map(
      (node) => node.textContent
    );

    expect(statValues).toEqual(["3", "5", "3,140"]);
  });
});
