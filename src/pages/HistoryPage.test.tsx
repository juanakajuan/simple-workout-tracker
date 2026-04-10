import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";

import type { Exercise, Workout } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { HistoryPage } from "./HistoryPage";

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
    exerciseType: overrides.exerciseType ?? "machine",
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

  return (
    <div>
      <div data-testid="location-path">{location.pathname}</div>
      <pre data-testid="location-state">{JSON.stringify(location.state ?? null)}</pre>
    </div>
  );
}

function HistoryRoute() {
  return (
    <>
      <HistoryPage />
      <RouteStateViewer />
    </>
  );
}

function renderHistoryPage(initialEntry: InitialEntry = "/history") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/history" element={<HistoryRoute />} />
        <Route path="/history/workout/:workoutId" element={<RouteStateViewer />} />
        <Route path="/history/weekly-sets" element={<RouteStateViewer />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("HistoryPage", () => {
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

  it("groups workouts by month and renders stats, muscle tags, and duration", () => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15, 9, 0, 0);

    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({ id: "exercise-chest", name: "Chest Press", muscleGroup: "chest" }),
      createExercise({ id: "exercise-back", name: "Cable Row", muscleGroup: "back" }),
    ]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "workout-current",
        name: "Upper A",
        date: now.toISOString(),
        duration: 3900,
        exercises: [
          {
            id: "workout-exercise-1",
            exerciseId: "exercise-chest",
            sets: [
              { id: "set-1", weight: 100, reps: 5, completed: true },
              { id: "set-2", weight: 110, reps: 5, completed: true },
              { id: "set-3", weight: 120, reps: 3, completed: false },
            ],
          },
          {
            id: "workout-exercise-2",
            exerciseId: "exercise-back",
            sets: [{ id: "set-4", weight: 80, reps: 4, completed: true }],
          },
        ],
      }),
      createWorkout({
        id: "workout-previous",
        name: "Leg Day",
        date: previousMonth.toISOString(),
        duration: 2700,
        exercises: [
          {
            id: "workout-exercise-3",
            exerciseId: "exercise-back",
            sets: [{ id: "set-5", weight: 50, reps: 10, completed: true }],
          },
        ],
      }),
    ]);

    renderHistoryPage();

    expect(
      screen.getByRole("heading", {
        name: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", {
        name: previousMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      })
    ).toBeDefined();
    expect(screen.getByText("Upper A")).toBeDefined();
    expect(screen.getByText("1,370 lbs")).toBeDefined();
    expect(screen.getByText("2 exercises")).toBeDefined();
    expect(screen.getByText("3 sets")).toBeDefined();
    expect(screen.getByText("1h 5m")).toBeDefined();
    expect(screen.getByText("45 min")).toBeDefined();
    expect(screen.getByText("Chest")).toBeDefined();
    expect(screen.getAllByText("Back").length).toBeGreaterThan(0);
  });

  it("opens delete confirmation from location state, clears the state, and removes the workout", async () => {
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({ id: "workout-1", name: "Upper A", exercises: [] }),
      createWorkout({ id: "workout-2", name: "Upper B", exercises: [] }),
    ]);

    renderHistoryPage({
      pathname: "/history",
      key: "delete-from-state",
      state: { deleteWorkoutId: "workout-1" },
    });

    expect(screen.getByText("Delete this workout?")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /send it to the shadow realm/i }));

    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId("location-state").textContent ?? "null")).toEqual({});
    });

    expect(getLS<Workout[]>(STORAGE_KEYS.WORKOUTS)).toEqual([
      expect.objectContaining({ id: "workout-2", name: "Upper B" }),
    ]);
    expect(screen.queryByText("Upper A")).toBeNull();
  });

  it("navigates to workout detail when a history card is clicked", async () => {
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({ id: "workout-1", name: "Upper A", exercises: [] }),
    ]);

    renderHistoryPage();

    fireEvent.click(screen.getByRole("button", { name: /upper a/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/history/workout/workout-1");
    });
  });

  it("navigates to the weekly sets tracker", async () => {
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({ id: "workout-1", name: "Upper A", exercises: [] }),
    ]);

    renderHistoryPage();

    fireEvent.click(screen.getByRole("button", { name: /view weekly sets tracker/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/history/weekly-sets");
    });
  });
});
