import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Workout, WorkoutTemplate } from "../types";
import {
  STORAGE_KEYS,
  exportAllData,
  formatRelativeDate,
  getActiveWorkout,
  getDraftTemplate,
  getExerciseHistory,
  getLastPerformedDate,
  getLastPerformedSets,
  getTemplates,
  hasActiveWorkout,
  importAllData,
  normalizeTemplateDraft,
  normalizeTemplates,
  saveActiveWorkout,
  saveTemplates,
} from "./storage";

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

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: "workout-1",
    name: "Push Day",
    date: "2026-04-04T09:00:00.000Z",
    startTime: "2026-04-04T08:00:00.000Z",
    exercises: [
      {
        id: "entry-1",
        exerciseId: "exercise-1",
        sets: [
          { id: "set-1", weight: 100, reps: 8, completed: true },
          { id: "set-2", weight: 95, reps: 10, completed: true },
        ],
      },
    ],
    completed: true,
    ...overrides,
  };
}

describe("storage utilities", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MockStorage());
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("normalizes stored templates and drops invalid records", () => {
    expect(
      normalizeTemplates([
        {
          id: "template-1",
          name: "  Upper A  ",
          muscleGroups: [
            {
              id: "group-1",
              muscleGroup: "chest",
              exercises: [
                { id: "exercise-1", exerciseId: "bench", setCount: 3 },
                { id: "exercise-2", exerciseId: 123, setCount: 0 },
                { id: "", exerciseId: "skip", setCount: 4 },
              ],
            },
            { id: "", muscleGroup: "back", exercises: [] },
          ],
        },
        {
          id: "template-2",
          name: "   ",
          muscleGroups: [],
        },
      ])
    ).toEqual<WorkoutTemplate[]>([
      {
        id: "template-1",
        name: "Upper A",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "chest",
            exercises: [
              { id: "exercise-1", exerciseId: "bench", setCount: 3 },
              { id: "exercise-2", exerciseId: null, setCount: 1 },
            ],
          },
        ],
      },
    ]);
  });

  it("normalizes draft templates from both current and legacy shapes", () => {
    expect(
      normalizeTemplateDraft({
        name: "Draft",
        exercises: [
          { id: "exercise-1", exerciseId: "squat", setCount: 5 },
          { id: "exercise-2", exerciseId: null, setCount: Number.NaN },
        ],
      })
    ).toEqual({
      name: "Draft",
      exercises: [
        { id: "exercise-1", exerciseId: "squat", setCount: 5 },
        { id: "exercise-2", exerciseId: null, setCount: 1 },
      ],
    });

    expect(
      normalizeTemplateDraft({
        name: "Legacy",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "back",
            exercises: [
              { id: "exercise-3", exerciseId: "row", setCount: 4 },
              { id: "", exerciseId: "invalid", setCount: 1 },
            ],
          },
        ],
      })
    ).toEqual({
      name: "Legacy",
      exercises: [{ id: "exercise-3", exerciseId: "row", setCount: 4 }],
    });
  });

  it("returns safe fallbacks for malformed stored JSON", () => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, "{");
    localStorage.setItem(STORAGE_KEYS.DRAFT_TEMPLATE, "{");
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, "{");

    expect(getTemplates()).toEqual([]);
    expect(getDraftTemplate()).toBeNull();
    expect(getActiveWorkout()).toBeNull();
    expect(hasActiveWorkout()).toBe(false);
  });

  it("saves templates in normalized form", () => {
    saveTemplates([
      {
        id: "template-1",
        name: "  Legs  ",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "quads",
            exercises: [{ id: "exercise-1", exerciseId: "squat", setCount: 0 }],
          },
        ],
      },
    ]);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) ?? "null")).toEqual([
      {
        id: "template-1",
        name: "Legs",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "quads",
            exercises: [{ id: "exercise-1", exerciseId: "squat", setCount: 1 }],
          },
        ],
      },
    ]);
  });

  it("clears the active workout when null is saved", () => {
    saveActiveWorkout(createWorkout());
    expect(hasActiveWorkout()).toBe(true);

    saveActiveWorkout(null);

    expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT)).toBeNull();
    expect(hasActiveWorkout()).toBe(false);
  });

  it("derives exercise history and last performed sets from completed workouts only", () => {
    const olderWorkout = createWorkout({
      id: "workout-older",
      date: "2026-03-28T09:00:00.000Z",
      exercises: [
        {
          id: "entry-older",
          exerciseId: "exercise-1",
          sets: [{ id: "set-older", weight: 90, reps: 12, completed: true }],
        },
      ],
    });
    const latestWorkout = createWorkout({
      id: "workout-latest",
      date: "2026-04-02T09:00:00.000Z",
      exercises: [
        {
          id: "entry-latest",
          exerciseId: "exercise-1",
          sets: [{ id: "set-latest", weight: 105, reps: 6, completed: true }],
        },
      ],
    });
    const incompleteWorkout = createWorkout({
      id: "workout-incomplete",
      date: "2026-04-03T09:00:00.000Z",
      completed: false,
    });

    localStorage.setItem(
      STORAGE_KEYS.WORKOUTS,
      JSON.stringify([olderWorkout, incompleteWorkout, latestWorkout])
    );

    expect(getLastPerformedDate("exercise-1")).toBe("2026-04-02T09:00:00.000Z");
    expect(getLastPerformedSets("exercise-1")).toEqual([{ weight: 105, reps: 6 }]);
    expect(getExerciseHistory("exercise-1").map((workout) => workout.id)).toEqual([
      "workout-latest",
      "workout-older",
    ]);
    expect(getLastPerformedDate("missing-exercise")).toBeNull();
    expect(getLastPerformedSets("missing-exercise")).toBeNull();
  });

  it("formats relative dates across day, week, month, and year boundaries", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-04T12:00:00.000Z"));

    expect(formatRelativeDate("2026-04-04T12:00:00.000Z")).toBe("today");
    expect(formatRelativeDate("2026-04-03T12:00:00.000Z")).toBe("yesterday");
    expect(formatRelativeDate("2026-03-30T12:00:00.000Z")).toBe("5 days ago");
    expect(formatRelativeDate("2026-03-21T12:00:00.000Z")).toBe("2 weeks ago");
    expect(formatRelativeDate("2026-02-24T12:00:00.000Z")).toBe("1 month ago");
    expect(formatRelativeDate("2025-02-28T12:00:00.000Z")).toBe("1 year ago");
  });

  it("exports only Zenith storage keys and canonicalizes migrated values", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-04T12:00:00.000Z"));

    localStorage.setItem(
      STORAGE_KEYS.TEMPLATES,
      JSON.stringify([
        {
          id: "template-1",
          name: "  Pull  ",
          muscleGroups: [{ id: "group-1", muscleGroup: "back", exercises: [] }],
        },
      ])
    );
    localStorage.setItem(
      STORAGE_KEYS.DRAFT_TEMPLATE,
      JSON.stringify({
        name: "Legacy Draft",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "back",
            exercises: [{ id: "exercise-1", exerciseId: "row", setCount: 4 }],
          },
        ],
      })
    );
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(createWorkout()));
    localStorage.setItem("not_zenith", JSON.stringify({ ignore: true }));

    const exported = JSON.parse(exportAllData()) as {
      version: string;
      appName: string;
      exportDate: string;
      data: Record<string, string>;
    };

    expect(exported.version).toBe("1.0");
    expect(exported.appName).toBe("Zenith");
    expect(exported.exportDate).toBe("2026-04-04T12:00:00.000Z");
    expect(Object.keys(exported.data)).toEqual(
      expect.arrayContaining([
        STORAGE_KEYS.TEMPLATES,
        STORAGE_KEYS.DRAFT_TEMPLATE,
        STORAGE_KEYS.ACTIVE_WORKOUT,
      ])
    );
    expect(exported.data.not_zenith).toBeUndefined();
    expect(JSON.parse(exported.data[STORAGE_KEYS.TEMPLATES])).toEqual([
      {
        id: "template-1",
        name: "Pull",
        muscleGroups: [{ id: "group-1", muscleGroup: "back", exercises: [] }],
      },
    ]);
    expect(JSON.parse(exported.data[STORAGE_KEYS.DRAFT_TEMPLATE])).toEqual({
      name: "Legacy Draft",
      exercises: [{ id: "exercise-1", exerciseId: "row", setCount: 4 }],
    });
  });

  it("imports valid backups, normalizes values, and omits null transient keys", () => {
    localStorage.setItem(
      STORAGE_KEYS.WORKOUTS,
      JSON.stringify([createWorkout({ id: "old-workout" })])
    );

    importAllData(
      JSON.stringify({
        version: "1.0",
        appName: "Zenith",
        exportDate: "2026-04-04T12:00:00.000Z",
        data: {
          [STORAGE_KEYS.TEMPLATES]: JSON.stringify([
            {
              id: "template-1",
              name: "  Full Body  ",
              muscleGroups: [{ id: "group-1", muscleGroup: "chest", exercises: [] }],
            },
          ]),
          [STORAGE_KEYS.DRAFT_TEMPLATE]: "null",
          [STORAGE_KEYS.ACTIVE_WORKOUT]: JSON.stringify(createWorkout({ id: "active-1" })),
          [STORAGE_KEYS.SETTINGS]: JSON.stringify({ autoMatchWeight: true }),
        },
      })
    );

    expect(localStorage.getItem(STORAGE_KEYS.WORKOUTS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.DRAFT_TEMPLATE)).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) ?? "null")).toEqual([
      {
        id: "template-1",
        name: "Full Body",
        muscleGroups: [{ id: "group-1", muscleGroup: "chest", exercises: [] }],
      },
    ]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT) ?? "null")).toMatchObject({
      id: "active-1",
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) ?? "null")).toEqual({
      autoMatchWeight: true,
    });
  });

  it("rejects invalid backup payloads before mutating storage", () => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ autoMatchWeight: false }));

    expect(() => importAllData("not json")).toThrow(
      "Invalid JSON file. Please select a valid Zenith backup file."
    );
    expect(() =>
      importAllData(JSON.stringify({ version: "1.0", appName: "Other", data: {} }))
    ).toThrow("This file is not a valid Zenith backup.");
    expect(() =>
      importAllData(JSON.stringify({ version: "1.0", appName: "Zenith", data: { bad: 123 } }))
    ).toThrow("Invalid backup file format. Backup entries must be strings.");

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) ?? "null")).toEqual({
      autoMatchWeight: false,
    });
  });

  it("restores the previous snapshot when import writes fail", () => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ autoMatchWeight: false }));
    localStorage.setItem(
      STORAGE_KEYS.TEMPLATES,
      JSON.stringify([{ id: "existing", name: "Keep", muscleGroups: [] }])
    );

    const originalSetItem = localStorage.setItem;
    let setItemCalls = 0;

    vi.spyOn(localStorage, "setItem").mockImplementation(function (this: Storage, key, value) {
      setItemCalls += 1;

      if (setItemCalls === 2) {
        throw new Error("storage full");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() =>
      importAllData(
        JSON.stringify({
          version: "1.0",
          appName: "Zenith",
          data: {
            [STORAGE_KEYS.TEMPLATES]: JSON.stringify([
              { id: "incoming", name: "Incoming", muscleGroups: [] },
            ]),
            [STORAGE_KEYS.WORKOUTS]: JSON.stringify([createWorkout({ id: "incoming-workout" })]),
          },
        })
      )
    ).toThrow("Failed to import data. Your storage may be full or the data may be too large.");

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) ?? "null")).toEqual({
      autoMatchWeight: false,
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) ?? "null")).toEqual([
      { id: "existing", name: "Keep", muscleGroups: [] },
    ]);
    expect(localStorage.getItem(STORAGE_KEYS.WORKOUTS)).toBeNull();
  });
});
