import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { Workout, WorkoutTemplate, WorkoutTemplateDraft } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { TemplatesPage } from "./TemplatesPage";

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

function renderTemplatesPage() {
  return render(
    <MemoryRouter initialEntries={["/templates"]}>
      <Routes>
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/new" element={<div>Template Editor</div>} />
        <Route path="/templates/edit/:id" element={<div>Edit Template Page</div>} />
        <Route path="/workout" element={<div>Workout Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TemplatesPage", () => {
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

  it("shows the draft banner and continues editing when the banner is clicked", async () => {
    setLS(STORAGE_KEYS.DRAFT_TEMPLATE, {
      name: "Draft Push",
      exercises: [{ id: "draft-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 }],
    } satisfies WorkoutTemplateDraft);

    renderTemplatesPage();

    fireEvent.click(screen.getByText("You have an unsaved template draft"));

    await waitFor(() => {
      expect(screen.getByText("Template Editor")).toBeDefined();
    });
  });

  it("confirms before dismissing the current draft and clears it on confirm", () => {
    setLS(STORAGE_KEYS.DRAFT_TEMPLATE, {
      name: "Draft Push",
      exercises: [{ id: "draft-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 }],
    } satisfies WorkoutTemplateDraft);

    renderTemplatesPage();

    fireEvent.click(screen.getByRole("button", { name: /dismiss draft/i }));
    expect(screen.getByText("Discard draft template?")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /^discard$/i }));

    expect(getLS(STORAGE_KEYS.DRAFT_TEMPLATE)).toBeNull();
    expect(screen.queryByText("You have an unsaved template draft")).toBeNull();
  });

  it("confirms before replacing an existing draft when creating a new template", async () => {
    setLS(STORAGE_KEYS.DRAFT_TEMPLATE, {
      name: "Draft Push",
      exercises: [{ id: "draft-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 }],
    } satisfies WorkoutTemplateDraft);

    renderTemplatesPage();

    fireEvent.click(screen.getByRole("button", { name: /create new template/i }));
    expect(screen.getByText("Discard unsaved draft?")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /^discard$/i }));

    await waitFor(() => {
      expect(screen.getByText("Template Editor")).toBeDefined();
    });
    expect(getLS(STORAGE_KEYS.DRAFT_TEMPLATE)).toBeNull();
  });

  it("renders template stats and starts a workout from the confirmed template", async () => {
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Upper A",
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
            exercises: [
              { id: "template-ex-2", exerciseId: "default-barbell-bent-over-row", setCount: 2 },
              { id: "template-ex-3", exerciseId: null, setCount: 4 },
            ],
          },
        ],
      },
    ] satisfies WorkoutTemplate[]);

    renderTemplatesPage();

    expect(screen.getByText("Upper A")).toBeDefined();
    expect(screen.getByText("Chest")).toBeDefined();
    expect(screen.getByText("Back")).toBeDefined();
    expect(screen.getByText("2 EXERCISES")).toBeDefined();
    expect(screen.getByText("5 SETS")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /upper a/i }));
    expect(screen.getByText('Start "Upper A"?')).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    await waitFor(() => {
      expect(screen.getByText("Workout Page")).toBeDefined();
    });

    expect(getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)).toMatchObject({
      name: "Upper A",
      templateId: "template-1",
      completed: false,
      exercises: [
        { exerciseId: "default-bench-press-medium-grip", sets: [{}, {}, {}] },
        { exerciseId: "default-barbell-bent-over-row", sets: [{}, {}] },
      ],
    });
  });

  it("warns before replacing an active workout when starting a template", async () => {
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Upper A",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "chest",
            exercises: [
              { id: "template-ex-1", exerciseId: "default-bench-press-medium-grip", setCount: 3 },
            ],
          },
        ],
      },
    ] satisfies WorkoutTemplate[]);
    setLS(STORAGE_KEYS.ACTIVE_WORKOUT, {
      id: "workout-1",
      name: "Current Workout",
      date: "2026-04-10T10:00:00.000Z",
      startTime: "2026-04-10T10:00:00.000Z",
      exercises: [],
      completed: false,
    } satisfies Workout);

    renderTemplatesPage();

    fireEvent.click(screen.getByRole("button", { name: /upper a/i }));

    expect(screen.getByText("Replace active workout?")).toBeDefined();
    expect(
      screen.getByText(
        "You have an active workout in progress. Starting this template will replace it. Do you want to continue?"
      )
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)).toMatchObject({
      id: "workout-1",
      name: "Current Workout",
    });

    fireEvent.click(screen.getByRole("button", { name: /upper a/i }));
    fireEvent.click(screen.getByRole("button", { name: /replace and start/i }));

    await waitFor(() => {
      expect(screen.getByText("Workout Page")).toBeDefined();
    });

    expect(getLS<Workout>(STORAGE_KEYS.ACTIVE_WORKOUT)).toMatchObject({
      name: "Upper A",
      templateId: "template-1",
    });
  });

  it("opens the kebab edit action and navigates to the template editor", async () => {
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Upper A",
        muscleGroups: [],
      },
    ] satisfies WorkoutTemplate[]);

    renderTemplatesPage();

    fireEvent.click(screen.getByRole("button", { name: /more options/i }));
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    await waitFor(() => {
      expect(screen.getByText("Edit Template Page")).toBeDefined();
    });
  });

  it("deletes the selected template through the kebab action after confirmation", () => {
    setLS(STORAGE_KEYS.TEMPLATES, [
      {
        id: "template-1",
        name: "Upper A",
        muscleGroups: [],
      },
    ] satisfies WorkoutTemplate[]);

    renderTemplatesPage();

    fireEvent.click(screen.getByRole("button", { name: /more options/i }));
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(screen.getByText("Delete this template?")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /send it to the shadow realm/i }));

    expect(getLS<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES)).toEqual([]);
    expect(screen.getByText("No templates yet.")).toBeDefined();
  });
});
