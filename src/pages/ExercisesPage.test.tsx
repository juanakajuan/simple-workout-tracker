import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import type { Exercise, Workout } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { ExercisesPage } from "./ExercisesPage";

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

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: overrides.id ?? "workout-1",
    name: overrides.name ?? "Workout",
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

function renderExercisesPage() {
  return render(
    <MemoryRouter initialEntries={["/exercises"]}>
      <Routes>
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/new" element={<RouteStateViewer />} />
        <Route path="/exercises/edit/:exerciseId" element={<RouteStateViewer />} />
        <Route path="/exercises/history/:exerciseId" element={<RouteStateViewer />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ExercisesPage", () => {
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

  it("merges default exercises with overrides and shows grouped last-performed details", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({
        id: "default-bench-press-medium-grip",
        name: "Bench Remix",
        muscleGroup: "chest",
        exerciseType: "barbell",
      }),
      createExercise({
        id: "exercise-cable-row",
        name: "Cable Row",
        muscleGroup: "back",
        exerciseType: "cable",
      }),
    ]);
    setLS(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        date: yesterday.toISOString(),
        exercises: [
          { id: "workout-exercise-1", exerciseId: "default-bench-press-medium-grip", sets: [] },
        ],
      }),
    ]);

    renderExercisesPage();

    expect(screen.getByRole("heading", { name: "Chest" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Back" })).toBeDefined();
    expect(screen.getByText("Bench Remix")).toBeDefined();
    expect(screen.queryByText("Bench Press (Medium Grip)")).toBeNull();
    expect(screen.getByText("Last performed yesterday")).toBeDefined();
    expect(screen.getByText("Cable Row")).toBeDefined();
  });

  it("filters exercises by search text and muscle group", () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({
        id: "exercise-alpha-fly",
        name: "Alpha Fly",
        muscleGroup: "chest",
      }),
      createExercise({
        id: "exercise-cable-row",
        name: "Cable Row",
        muscleGroup: "back",
      }),
    ]);

    renderExercisesPage();

    fireEvent.change(screen.getByPlaceholderText("Search exercises..."), {
      target: { value: "alpha fly" },
    });

    expect(screen.getByText("Alpha Fly")).toBeDefined();
    expect(screen.queryByText("Cable Row")).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Search exercises..."), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "back" },
    });

    expect(screen.queryByRole("heading", { name: "Chest" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Back" })).toBeDefined();
    expect(screen.getByText("Cable Row")).toBeDefined();
    expect(screen.queryByText("Alpha Fly")).toBeNull();
  });

  it("navigates to the new-exercise page from the header action", async () => {
    renderExercisesPage();

    fireEvent.click(screen.getByRole("button", { name: /create new exercise/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/exercises/new");
    });
  });

  it("opens exercise history when the card is clicked", async () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({
        id: "exercise-cable-row",
        name: "Cable Row",
        muscleGroup: "back",
      }),
    ]);

    renderExercisesPage();

    fireEvent.click(screen.getByText("Cable Row"));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe(
        "/exercises/history/exercise-cable-row"
      );
    });
  });

  it("opens the edit route from the exercise card menu", async () => {
    setLS(STORAGE_KEYS.EXERCISES, [
      createExercise({
        id: "exercise-cable-row",
        name: "Cable Row",
        muscleGroup: "back",
      }),
    ]);

    renderExercisesPage();

    const card = screen.getByText("Cable Row").closest(".exercise-card");
    expect(card).not.toBeNull();

    fireEvent.click(within(card as HTMLElement).getByRole("button", { name: /exercise options/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit exercise/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe(
        "/exercises/edit/exercise-cable-row"
      );
    });
  });
});
