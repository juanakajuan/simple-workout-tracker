import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, type InitialEntry } from "react-router-dom";

import type { Exercise, WorkoutTemplate, WorkoutTemplateDraft } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { ExerciseSelectorPage } from "./ExerciseSelectorPage";
import { TemplateEditorPage } from "./TemplateEditorPage";

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

function renderTemplateEditor(initialEntry: InitialEntry = "/templates/new") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/templates" element={<div>Templates List</div>} />
        <Route path="/templates/new" element={<TemplateEditorPage />} />
        <Route path="/templates/new/select-exercise" element={<ExerciseSelectorPage />} />
        <Route path="/templates/edit/:id" element={<TemplateEditorPage />} />
        <Route path="/templates/edit/:id/select-exercise" element={<ExerciseSelectorPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TemplateEditorPage", () => {
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

  it("restores a draft and persists reducer-driven edits for new templates", async () => {
    const chestPress = createExercise({
      id: "exercise-chest-press",
      name: "Chest Press",
      muscleGroup: "chest",
    });
    const seatedRow = createExercise({
      id: "exercise-seated-row",
      name: "Seated Row",
      muscleGroup: "back",
    });

    const draft: WorkoutTemplateDraft = {
      name: "Draft Push Pull",
      exercises: [
        { id: "draft-1", exerciseId: chestPress.id, setCount: 2 },
        { id: "draft-2", exerciseId: seatedRow.id, setCount: 4 },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [chestPress, seatedRow]);
    setLS(STORAGE_KEYS.DRAFT_TEMPLATE, draft);

    renderTemplateEditor();

    expect(screen.getByDisplayValue("Draft Push Pull")).toBeDefined();
    expect(screen.getByRole("button", { name: "Chest Press" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Seated Row" })).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText("Enter template name..."), {
      target: { value: "Updated Draft" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /move up/i })[1]);

    await waitFor(() => {
      expect(
        getLS<WorkoutTemplateDraft>(STORAGE_KEYS.DRAFT_TEMPLATE)?.exercises.map(
          (exercise) => exercise.exerciseId
        )
      ).toEqual([seatedRow.id, chestPress.id]);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /increase sets/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /remove exercise/i })[1]);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Chest Press" })).toBeNull();

      expect(getLS<WorkoutTemplateDraft>(STORAGE_KEYS.DRAFT_TEMPLATE)).toEqual({
        name: "Updated Draft",
        exercises: [
          {
            id: "draft-2",
            exerciseId: seatedRow.id,
            setCount: 5,
          },
        ],
      });
    });
  });

  it("appends a selected exercise when returning from the selector", async () => {
    const latPulldown = createExercise({
      id: "exercise-lat-pulldown",
      name: "Lat Pulldown",
      muscleGroup: "back",
    });

    setLS(STORAGE_KEYS.EXERCISES, [latPulldown]);

    renderTemplateEditor({
      pathname: "/templates/new",
      key: "append-selection",
      state: {
        selectedExerciseId: latPulldown.id,
        appendTemplateExercise: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Lat Pulldown" })).toBeDefined();
      expect(getLS<WorkoutTemplateDraft>(STORAGE_KEYS.DRAFT_TEMPLATE)).toMatchObject({
        name: "",
        exercises: [
          {
            exerciseId: latPulldown.id,
            setCount: 3,
          },
        ],
      });
      expect(getLS<WorkoutTemplateDraft>(STORAGE_KEYS.DRAFT_TEMPLATE)?.exercises[0].id).toEqual(
        expect.any(String)
      );
    });
  });

  it("replaces the targeted template exercise when returning from the selector", async () => {
    const inclinePress = createExercise({
      id: "exercise-incline-press",
      name: "Incline Press",
      muscleGroup: "chest",
    });
    const cableFly = createExercise({
      id: "exercise-cable-fly",
      name: "Cable Fly",
      muscleGroup: "chest",
    });

    setLS(STORAGE_KEYS.EXERCISES, [inclinePress, cableFly]);
    setLS(STORAGE_KEYS.DRAFT_TEMPLATE, {
      name: "Chest Day",
      exercises: [{ id: "draft-1", exerciseId: inclinePress.id, setCount: 3 }],
    } satisfies WorkoutTemplateDraft);

    renderTemplateEditor({
      pathname: "/templates/new",
      key: "replace-selection",
      state: {
        selectedExerciseId: cableFly.id,
        templateSelectionTarget: {
          templateExerciseId: "draft-1",
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Incline Press" })).toBeNull();
      expect(screen.getByRole("button", { name: "Cable Fly" })).toBeDefined();
      expect(getLS<WorkoutTemplateDraft>(STORAGE_KEYS.DRAFT_TEMPLATE)).toEqual({
        name: "Chest Day",
        exercises: [{ id: "draft-1", exerciseId: cableFly.id, setCount: 3 }],
      });
    });
  });

  it("rebuilds muscle groups from the edited exercise order when saving", async () => {
    const inclinePress = createExercise({
      id: "exercise-incline-press",
      name: "Incline Press",
      muscleGroup: "chest",
    });
    const chestFly = createExercise({
      id: "exercise-chest-fly",
      name: "Chest Fly",
      muscleGroup: "chest",
    });
    const tBarRow = createExercise({
      id: "exercise-tbar-row",
      name: "T-Bar Row",
      muscleGroup: "back",
    });

    const template: WorkoutTemplate = {
      id: "template-1",
      name: "Upper A",
      muscleGroups: [
        {
          id: "group-1",
          muscleGroup: "chest",
          exercises: [
            { id: "template-exercise-1", exerciseId: inclinePress.id, setCount: 3 },
            { id: "template-exercise-2", exerciseId: chestFly.id, setCount: 2 },
          ],
        },
        {
          id: "group-2",
          muscleGroup: "back",
          exercises: [{ id: "template-exercise-3", exerciseId: tBarRow.id, setCount: 4 }],
        },
      ],
    };

    setLS(STORAGE_KEYS.EXERCISES, [inclinePress, chestFly, tBarRow]);
    setLS(STORAGE_KEYS.TEMPLATES, [template]);

    renderTemplateEditor("/templates/edit/template-1");

    fireEvent.click(screen.getAllByRole("button", { name: /move up/i })[2]);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText("Templates List")).toBeDefined();
    });

    expect(getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)).toEqual([
      {
        id: "template-1",
        name: "Upper A",
        muscleGroups: [
          {
            id: expect.any(String),
            muscleGroup: "chest",
            exercises: [{ id: "template-exercise-1", exerciseId: inclinePress.id, setCount: 3 }],
          },
          {
            id: expect.any(String),
            muscleGroup: "back",
            exercises: [{ id: "template-exercise-3", exerciseId: tBarRow.id, setCount: 4 }],
          },
          {
            id: expect.any(String),
            muscleGroup: "chest",
            exercises: [{ id: "template-exercise-2", exerciseId: chestFly.id, setCount: 2 }],
          },
        ],
      },
    ]);
  });

  it("preserves edit-mode changes when adding an exercise through the selector", async () => {
    const benchPress = createExercise({
      id: "exercise-bench-press",
      name: "Bench Press",
      muscleGroup: "chest",
    });
    const seatedRow = createExercise({
      id: "exercise-seated-row",
      name: "Seated Row",
      muscleGroup: "back",
    });
    const cableFly = createExercise({
      id: "exercise-cable-fly",
      name: "Cable Fly",
      muscleGroup: "chest",
    });

    setLS(STORAGE_KEYS.EXERCISES, [benchPress, seatedRow, cableFly]);
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Upper A",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "chest",
            exercises: [{ id: "template-exercise-1", exerciseId: benchPress.id, setCount: 3 }],
          },
          {
            id: "group-2",
            muscleGroup: "back",
            exercises: [{ id: "template-exercise-2", exerciseId: seatedRow.id, setCount: 4 }],
          },
        ],
      } satisfies WorkoutTemplate,
    ]);

    const { container } = renderTemplateEditor("/templates/edit/template-1");

    fireEvent.change(screen.getByPlaceholderText("Enter template name..."), {
      target: { value: "Updated Upper A" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /increase sets/i })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: /move up/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /add exercise/i }));

    await screen.findByPlaceholderText("Search exercises...");

    const cableFlyOption = (await screen.findByText("Cable Fly")).closest("button");
    expect(cableFlyOption).not.toBeNull();
    fireEvent.click(cableFlyOption!);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Updated Upper A")).toBeDefined();
    });

    expect(
      Array.from(container.querySelectorAll<HTMLButtonElement>(".templates-exercise-btn")).map(
        (button) => button.textContent
      )
    ).toEqual(["Seated Row", "Bench Press", "Cable Fly"]);
    expect(
      Array.from(container.querySelectorAll(".templates-set-count-value")).map(
        (value) => value.textContent
      )
    ).toEqual(["5", "3", "3"]);
  });

  it("preserves edit-mode changes when backing out of the selector", async () => {
    const inclinePress = createExercise({
      id: "exercise-incline-press",
      name: "Incline Press",
      muscleGroup: "chest",
    });
    const chestSupportedRow = createExercise({
      id: "exercise-chest-supported-row",
      name: "Chest Supported Row",
      muscleGroup: "back",
    });

    setLS(STORAGE_KEYS.EXERCISES, [inclinePress, chestSupportedRow]);
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Upper B",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "chest",
            exercises: [{ id: "template-exercise-1", exerciseId: inclinePress.id, setCount: 2 }],
          },
          {
            id: "group-2",
            muscleGroup: "back",
            exercises: [
              {
                id: "template-exercise-2",
                exerciseId: chestSupportedRow.id,
                setCount: 3,
              },
            ],
          },
        ],
      } satisfies WorkoutTemplate,
    ]);

    const { container } = renderTemplateEditor("/templates/edit/template-1");

    fireEvent.change(screen.getByPlaceholderText("Enter template name..."), {
      target: { value: "Upper B Updated" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /increase sets/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /move up/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Incline Press" }));

    await screen.findByPlaceholderText("Search exercises...");

    fireEvent.click(await screen.findByRole("button", { name: /go back/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Upper B Updated")).toBeDefined();
    });

    expect(
      Array.from(container.querySelectorAll<HTMLButtonElement>(".templates-exercise-btn")).map(
        (button) => button.textContent
      )
    ).toEqual(["Chest Supported Row", "Incline Press"]);
    expect(
      Array.from(container.querySelectorAll(".templates-set-count-value")).map(
        (value) => value.textContent
      )
    ).toEqual(["3", "3"]);
  });

  it("restores an edit draft after leaving the template tab and coming back", async () => {
    const benchPress = createExercise({
      id: "exercise-bench-press",
      name: "Bench Press",
      muscleGroup: "chest",
    });
    const seatedRow = createExercise({
      id: "exercise-seated-row",
      name: "Seated Row",
      muscleGroup: "back",
    });
    const pecDeck = createExercise({
      id: "exercise-pec-deck",
      name: "Pec Deck",
      muscleGroup: "chest",
    });

    setLS(STORAGE_KEYS.EXERCISES, [benchPress, seatedRow, pecDeck]);
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Upper A",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "chest",
            exercises: [{ id: "template-exercise-1", exerciseId: benchPress.id, setCount: 3 }],
          },
          {
            id: "group-2",
            muscleGroup: "back",
            exercises: [{ id: "template-exercise-2", exerciseId: seatedRow.id, setCount: 4 }],
          },
        ],
      } satisfies WorkoutTemplate,
    ]);

    renderTemplateEditor("/templates/edit/template-1");

    fireEvent.change(screen.getByPlaceholderText("Enter template name..."), {
      target: { value: "Upper A Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add exercise/i }));

    await screen.findByPlaceholderText("Search exercises...");

    const pecDeckOption = (await screen.findByText("Pec Deck")).closest("button");
    expect(pecDeckOption).not.toBeNull();
    fireEvent.click(pecDeckOption!);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Upper A Updated")).toBeDefined();
      expect(screen.getByRole("button", { name: "Pec Deck" })).toBeDefined();
    });

    expect(
      getLS<Record<string, WorkoutTemplateDraft>>(STORAGE_KEYS.EDIT_TEMPLATE_DRAFTS)
    ).toMatchObject({
      "template-1": {
        name: "Upper A Updated",
        exercises: [
          { exerciseId: benchPress.id, setCount: 3 },
          { exerciseId: seatedRow.id, setCount: 4 },
          { exerciseId: pecDeck.id, setCount: 3 },
        ],
      },
    });

    cleanup();

    renderTemplateEditor("/templates/edit/template-1");

    expect(screen.getByDisplayValue("Upper A Updated")).toBeDefined();
    expect(screen.getByRole("button", { name: "Bench Press" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Seated Row" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Pec Deck" })).toBeDefined();
  });
});
