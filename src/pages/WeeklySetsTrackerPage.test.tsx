import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { Exercise, Workout, WorkoutExercise } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { WeeklySetsTrackerPage } from "./WeeklySetsTrackerPage";

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
    exerciseType: overrides.exerciseType ?? "machine",
    notes: overrides.notes ?? "",
  };
}

function createWorkoutExercise(exerciseId: string, completedStates: boolean[]): WorkoutExercise {
  return {
    id: `entry-${exerciseId}-${completedStates.length}`,
    exerciseId,
    sets: completedStates.map((completed, index) => ({
      id: `${exerciseId}-set-${index + 1}`,
      weight: 100,
      reps: 10,
      completed,
    })),
  };
}

function createWorkout(overrides: Partial<Workout> & Pick<Workout, "id" | "date">): Workout {
  return {
    id: overrides.id,
    name: overrides.name ?? "Workout",
    date: overrides.date,
    startTime: overrides.startTime ?? overrides.date,
    exercises: overrides.exercises ?? [],
    completed: overrides.completed ?? true,
    duration: overrides.duration,
    templateId: overrides.templateId,
  };
}

function renderWeeklySetsTracker() {
  return render(
    <MemoryRouter>
      <WeeklySetsTrackerPage />
    </MemoryRouter>
  );
}

describe("WeeklySetsTrackerPage", () => {
  beforeEach(() => {
    mockStorage.clear();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    window.ResizeObserver = MockResizeObserver;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15, 12, 0, 0));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("aggregates the rolling 8-week Monday window and orders rows by current week, total sets, then label", () => {
    const chestPress = createExercise({
      id: "exercise-chest-press",
      name: "Chest Press",
      muscleGroup: "chest",
    });
    const cableRow = createExercise({
      id: "exercise-cable-row",
      name: "Cable Row",
      muscleGroup: "back",
    });
    const crunch = createExercise({
      id: "exercise-crunch",
      name: "Crunch",
      muscleGroup: "abs",
    });

    setLS(STORAGE_KEYS.EXERCISES, [chestPress, cableRow, crunch]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "outside-window",
        date: "2026-02-22T12:00:00",
        exercises: [createWorkoutExercise(chestPress.id, [true, true, true, true, true])],
      }),
      createWorkout({
        id: "back-week-1",
        date: "2026-02-23T12:00:00",
        exercises: [createWorkoutExercise(cableRow.id, [true, true])],
      }),
      createWorkout({
        id: "abs-week-2",
        date: "2026-03-02T12:00:00",
        exercises: [createWorkoutExercise(crunch.id, [true, true])],
      }),
      createWorkout({
        id: "back-week-3",
        date: "2026-03-09T12:00:00",
        exercises: [createWorkoutExercise(cableRow.id, [true])],
      }),
      createWorkout({
        id: "abs-week-4",
        date: "2026-03-16T12:00:00",
        exercises: [createWorkoutExercise(crunch.id, [true])],
      }),
      createWorkout({
        id: "chest-week-5",
        date: "2026-03-23T12:00:00",
        exercises: [createWorkoutExercise(chestPress.id, [true])],
      }),
      createWorkout({
        id: "abs-week-6",
        date: "2026-03-30T12:00:00",
        exercises: [createWorkoutExercise(crunch.id, [true, true])],
      }),
      createWorkout({
        id: "back-week-6",
        date: "2026-03-30T18:00:00",
        exercises: [createWorkoutExercise(cableRow.id, [true, true])],
      }),
      createWorkout({
        id: "chest-sunday-boundary",
        date: "2026-04-12T12:00:00",
        exercises: [createWorkoutExercise(chestPress.id, [true, true])],
      }),
      createWorkout({
        id: "chest-monday-boundary",
        date: "2026-04-13T12:00:00",
        exercises: [createWorkoutExercise(chestPress.id, [true, true, true])],
      }),
      createWorkout({
        id: "back-current-week",
        date: "2026-04-15T12:00:00",
        exercises: [createWorkoutExercise(cableRow.id, [true, true, true, true])],
      }),
      createWorkout({
        id: "abs-current-week",
        date: "2026-04-14T12:00:00",
        exercises: [createWorkoutExercise(crunch.id, [true, true, true, true])],
      }),
      createWorkout({
        id: "ignored-incomplete",
        date: "2026-04-15T15:00:00",
        completed: false,
        exercises: [createWorkoutExercise(chestPress.id, [true, true, true])],
      }),
    ]);

    const { container } = renderWeeklySetsTracker();

    expect(screen.getByText("Last 8 weeks (Mon-Sun): Feb 23 - Apr 13")).toBeDefined();

    expect(
      Array.from(container.querySelectorAll(".weekly-muscle-group-row .tag"), (element) =>
        element.textContent?.trim()
      )
    ).toEqual(["Abs", "Back", "Chest"]);

    const rows = Array.from(container.querySelectorAll(".weekly-muscle-group-row"));
    const [absRow, backRow, chestRow] = rows;

    expect(absRow?.textContent).toContain("4 this week");
    expect(absRow?.textContent).toContain("+4 new sets");
    expect(backRow?.textContent).toContain("4 this week");
    expect(backRow?.textContent).toContain("+4 new sets");
    expect(chestRow?.textContent).toContain("3 this week");
    expect(chestRow?.textContent).toContain("+1 vs last week");

    expect(
      Array.from(chestRow?.querySelectorAll(".weekly-bar-count") ?? [], (element) =>
        element.textContent?.trim()
      )
    ).toEqual(["0", "0", "0", "0", "1", "0", "2", "3"]);
  });

  it("shows the empty state when the current 8-week window has no completed sets", () => {
    const chestPress = createExercise({
      id: "exercise-chest-press",
      name: "Chest Press",
      muscleGroup: "chest",
    });

    setLS(STORAGE_KEYS.EXERCISES, [chestPress]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "too-old",
        date: "2026-02-22T12:00:00",
        exercises: [createWorkoutExercise(chestPress.id, [true, true])],
      }),
      createWorkout({
        id: "incomplete-only",
        date: "2026-04-15T12:00:00",
        completed: false,
        exercises: [createWorkoutExercise(chestPress.id, [true, true])],
      }),
    ]);

    renderWeeklySetsTracker();

    expect(screen.getByText("No completed sets in the last 8 weeks.")).toBeDefined();
    expect(screen.getByText("Finish workouts to unlock weekly muscle-group trends.")).toBeDefined();
  });
});
