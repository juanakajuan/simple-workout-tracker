import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";

import type { Exercise, Workout } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { ExerciseSelectorPage } from "./ExerciseSelectorPage";

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

/** Stores a JSON-serializable value in the mocked local storage. */
function setLocalStorageItem(key: string, value: unknown): void {
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
    name: overrides.name ?? "Completed Workout",
    date: overrides.date ?? new Date().toISOString(),
    startTime: overrides.startTime ?? new Date().toISOString(),
    duration: overrides.duration,
    completed: overrides.completed ?? true,
    exercises: overrides.exercises ?? [],
    templateId: overrides.templateId,
  };
}

function RouteStateViewer(): ReactElement {
  const location = useLocation();

  return (
    <div>
      <div data-testid="location-path">{location.pathname}</div>
      <pre data-testid="location-state">{JSON.stringify(location.state ?? null)}</pre>
    </div>
  );
}

function renderExerciseSelector(initialEntry: InitialEntry): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/workout" element={<RouteStateViewer />} />
        <Route path="/workout/select-exercise" element={<ExerciseSelectorPage />} />
        <Route path="/workout/select-exercise/new" element={<RouteStateViewer />} />
        <Route path="/templates/new" element={<RouteStateViewer />} />
        <Route path="/templates/new/select-exercise" element={<ExerciseSelectorPage />} />
        <Route path="/templates/new/select-exercise/new" element={<RouteStateViewer />} />
      </Routes>
    </MemoryRouter>
  );
}

/** Reads the current route state rendered by `RouteStateViewer`. */
function readRouteState(): unknown {
  return JSON.parse(screen.getByTestId("location-state").textContent ?? "null");
}

describe("ExerciseSelectorPage", () => {
  beforeEach(() => {
    mockStorage.clear();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: vi.fn(),
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

  it("supports grouped search and muscle filtering while showing last performed info", () => {
    const betaFly = createExercise({
      id: "exercise-beta-fly",
      name: "Beta Fly",
      muscleGroup: "chest",
    });
    const alphaPress = createExercise({
      id: "exercise-alpha-press",
      name: "Alpha Press",
      muscleGroup: "chest",
    });
    const cableRow = createExercise({
      id: "exercise-cable-row",
      name: "Cable Row",
      muscleGroup: "back",
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    setLocalStorageItem(STORAGE_KEYS.WORKOUTS, [
      createWorkout({
        id: "completed-1",
        date: yesterday.toISOString(),
        exercises: [{ id: "workout-exercise-1", exerciseId: alphaPress.id, sets: [] }],
      }),
    ]);

    renderExerciseSelector({
      pathname: "/workout/select-exercise",
      key: "grouping-search-filter",
      state: {
        exercises: [betaFly, cableRow, alphaPress],
      },
    });

    expect(screen.getByRole("heading", { name: "Chest" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Back" })).toBeDefined();

    const chestHeading = screen.getByRole("heading", { name: "Chest" });
    const chestGroup = chestHeading.closest(".selector-group");
    const searchInput = screen.getByPlaceholderText("Search exercises...");

    expect(chestGroup).not.toBeNull();
    expect(
      Array.from(
        chestGroup!.querySelectorAll(".selector-item-name"),
        (element) => element.textContent
      )
    ).toEqual(["Alpha Press", "Beta Fly"]);
    expect(screen.getByText("Last performed yesterday")).toBeDefined();

    fireEvent.change(searchInput, {
      target: { value: "row" },
    });

    expect(screen.queryByText("Alpha Press")).toBeNull();
    expect(screen.queryByText("Beta Fly")).toBeNull();
    expect(screen.getByText("Cable Row")).toBeDefined();

    fireEvent.change(searchInput, {
      target: { value: "" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "back" },
    });

    expect(screen.queryByRole("heading", { name: "Chest" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Back" })).toBeDefined();
    expect(screen.queryByText("Alpha Press")).toBeNull();
    expect(screen.getByText("Cable Row")).toBeDefined();
  });

  it("handles replacement selection and returns update-template state to the workout page", async () => {
    const currentExercise = createExercise({
      id: "exercise-current",
      name: "Current Press",
      muscleGroup: "chest",
    });
    const replacementExercise = createExercise({
      id: "exercise-replacement",
      name: "Replacement Press",
      muscleGroup: "chest",
    });

    renderExerciseSelector({
      pathname: "/workout/select-exercise",
      key: "replacement-flow",
      state: {
        exercises: [currentExercise, replacementExercise],
        isReplacement: true,
        hideFilter: true,
        currentExerciseId: currentExercise.id,
        replacementWorkoutExerciseId: "workout-exercise-42",
        showTemplateUpdate: true,
        templateUpdateChecked: true,
      },
    });

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Current Press")).toBeNull();

    const okButton = screen.getByRole("button", { name: /ok/i }) as HTMLButtonElement;
    expect(okButton.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /replacement press/i }));
    expect(okButton.disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /replacement press/i }));
    expect(okButton.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /replacement press/i }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(okButton);

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/workout");
    });

    expect(readRouteState()).toEqual({
      selectedExerciseId: replacementExercise.id,
      updateTemplate: false,
      replacementWorkoutExerciseId: "workout-exercise-42",
    });
  });

  it("passes the current filter and template-update choice into the new exercise flow", async () => {
    const chestPress = createExercise({
      id: "exercise-chest-press",
      name: "Chest Press",
      muscleGroup: "chest",
    });
    const latPulldown = createExercise({
      id: "exercise-lat-pulldown",
      name: "Lat Pulldown",
      muscleGroup: "back",
    });

    renderExerciseSelector({
      pathname: "/templates/new/select-exercise",
      key: "create-new-flow",
      state: {
        exercises: [chestPress, latPulldown],
        initialMuscleGroup: "chest",
        isTemplateWorkout: true,
        showTemplateUpdate: true,
        templateUpdateChecked: false,
        appendTemplateExercise: true,
      },
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "back" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /create new exercise/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe(
        "/templates/new/select-exercise/new"
      );
    });

    expect(readRouteState()).toMatchObject({
      initialMuscleGroup: "back",
      templateUpdateChecked: true,
      appendTemplateExercise: true,
    });
  });

  it("returns a newly created exercise to the parent route with preserved selector state", async () => {
    const newExercise = createExercise({
      id: "exercise-new",
      name: "New Exercise",
      muscleGroup: "shoulders",
    });

    renderExerciseSelector({
      pathname: "/templates/new/select-exercise",
      key: "saved-exercise-return",
      state: {
        exercises: [newExercise],
        savedExerciseId: newExercise.id,
        templateUpdateChecked: true,
        replacementWorkoutExerciseId: "workout-exercise-99",
        templateSelectionTarget: {
          templateExerciseId: "template-exercise-7",
        },
        appendTemplateExercise: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/templates/new");
    });

    expect(readRouteState()).toEqual({
      selectedExerciseId: newExercise.id,
      updateTemplate: true,
      replacementWorkoutExerciseId: "workout-exercise-99",
      templateSelectionTarget: {
        templateExerciseId: "template-exercise-7",
      },
      appendTemplateExercise: true,
    });
  });
});
