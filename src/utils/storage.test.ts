import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Exercise, Workout, WorkoutTemplate } from "../types";
import {
  deleteExerciseAndRepairReferences,
  STORAGE_KEYS,
  exportAllData,
  formatRelativeDate,
  getActiveWorkout,
  getDraftTemplate,
  getExercises,
  getExerciseHistory,
  getLastPerformedDate,
  getLastPerformedSets,
  getSettings,
  getTemplates,
  getWorkouts,
  hasActiveWorkout,
  importAllData,
  normalizeActiveWorkout,
  normalizeTemplateDraft,
  normalizeTemplates,
  saveActiveWorkout,
  saveExercises,
  saveSettings,
  saveTemplates,
  saveWorkouts,
} from "./storage";

class MockStorage implements Storage {
  private storageEntries = new Map<string, string>();

  get length(): number {
    return this.storageEntries.size;
  }

  clear(): void {
    this.storageEntries.clear();
  }

  getItem(key: string): string | null {
    return this.storageEntries.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.storageEntries.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.storageEntries.delete(key);
  }

  setItem(key: string, value: string): void {
    this.storageEntries.set(key, value);
  }
}

/** Reads a JSON value from localStorage using the same null fallback used in production. */
function readStoredJsonValue(storageKey: string): unknown {
  return JSON.parse(localStorage.getItem(storageKey) ?? "null");
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

  it("preserves intensity metadata while normalizing templates and active workouts", () => {
    expect(
      normalizeTemplates([
        {
          id: "template-1",
          name: "Upper",
          muscleGroups: [
            {
              id: "group-1",
              muscleGroup: "chest",
              exercises: [
                {
                  id: "exercise-1",
                  exerciseId: "bench",
                  setCount: 3,
                  intensityTechnique: "super-set",
                  supersetGroupId: "pair-1",
                },
              ],
            },
          ],
        },
      ])
    ).toEqual<WorkoutTemplate[]>([
      {
        id: "template-1",
        name: "Upper",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "chest",
            exercises: [
              {
                id: "exercise-1",
                exerciseId: "bench",
                setCount: 3,
                intensityTechnique: "super-set",
                supersetGroupId: "pair-1",
              },
            ],
          },
        ],
      },
    ]);

    expect(
      normalizeActiveWorkout({
        id: "workout-1",
        name: "Push Day",
        date: "2026-04-04T09:00:00.000Z",
        startTime: "2026-04-04T08:00:00.000Z",
        exercises: [
          {
            id: "entry-1",
            exerciseId: "exercise-1",
            intensityTechnique: "drop-set",
            supersetGroupId: 123,
            sets: [{ id: "set-1", weight: 100, reps: 8, completed: true }],
          },
        ],
        completed: false,
      })
    ).toEqual({
      id: "workout-1",
      name: "Push Day",
      date: "2026-04-04T09:00:00.000Z",
      startTime: "2026-04-04T08:00:00.000Z",
      exercises: [
        {
          id: "entry-1",
          exerciseId: "exercise-1",
          intensityTechnique: "drop-set",
          sets: [{ id: "set-1", weight: 100, reps: 8, completed: true }],
        },
      ],
      completed: false,
    });
  });

  it("normalizes active workouts and rejects unusable values", () => {
    expect(
      normalizeActiveWorkout({
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
              { id: "", weight: 95, reps: 10, completed: true },
            ],
          },
          {
            id: "",
            exerciseId: "exercise-2",
            sets: [],
          },
        ],
        completed: false,
        duration: Number.NaN,
        templateId: 123,
      })
    ).toEqual({
      id: "workout-1",
      name: "Push Day",
      date: "2026-04-04T09:00:00.000Z",
      startTime: "2026-04-04T08:00:00.000Z",
      exercises: [
        {
          id: "entry-1",
          exerciseId: "exercise-1",
          sets: [{ id: "set-1", weight: 100, reps: 8, completed: true }],
        },
      ],
      completed: false,
    });

    expect(
      normalizeActiveWorkout({
        id: "broken-workout",
        name: "Broken",
        date: "not-a-date",
        startTime: "2026-04-04T08:00:00.000Z",
        exercises: [],
        completed: false,
      })
    ).toBeNull();
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

  it("drops corrupted active workouts with the wrong shape", () => {
    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      JSON.stringify({ id: "broken-workout", name: "Broken", completed: false })
    );

    expect(getActiveWorkout()).toBeNull();
    expect(hasActiveWorkout()).toBe(false);
  });

  it("reads and writes exercises, workouts, and settings with malformed-json fallbacks", () => {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, "{");
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, "{");
    localStorage.setItem(STORAGE_KEYS.SETTINGS, "{");

    expect(getExercises()).toEqual([]);
    expect(getWorkouts()).toEqual([]);
    expect(getSettings()).toEqual({ autoMatchWeight: false });

    const exercises = [
      {
        id: "exercise-1",
        name: "Lat Pulldown",
        muscleGroup: "back",
        exerciseType: "machine",
        notes: "Use straps if grip fades.",
      },
    ] as const;
    const workouts = [createWorkout({ id: "saved-workout" })];

    saveExercises([...exercises]);
    saveWorkouts(workouts);
    saveSettings({ autoMatchWeight: true });

    expect(getExercises()).toEqual(exercises);
    expect(getWorkouts()).toEqual(workouts);
    expect(getSettings()).toEqual({ autoMatchWeight: true });
    expect(readStoredJsonValue(STORAGE_KEYS.EXERCISES)).toEqual(exercises);
    expect(readStoredJsonValue(STORAGE_KEYS.WORKOUTS)).toEqual(workouts);
    expect(readStoredJsonValue(STORAGE_KEYS.SETTINGS)).toEqual({
      autoMatchWeight: true,
    });
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

    expect(readStoredJsonValue(STORAGE_KEYS.TEMPLATES)).toEqual([
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

  it("repairs dependent records when deleting a custom exercise", () => {
    const deletedExercise: Exercise = {
      id: "exercise-row",
      name: "Cable Row",
      muscleGroup: "back",
      exerciseType: "cable",
      notes: "Drive elbows low.",
    };

    saveExercises([
      deletedExercise,
      {
        id: "exercise-press",
        name: "Machine Press",
        muscleGroup: "chest",
        exerciseType: "machine",
        notes: "",
      },
    ]);
    saveActiveWorkout(
      createWorkout({
        completed: false,
        exercises: [
          {
            id: "active-row",
            exerciseId: deletedExercise.id,
            intensityTechnique: "super-set",
            supersetGroupId: "pair-1",
            sets: [{ id: "active-set-1", weight: 100, reps: 8, completed: true }],
          },
          {
            id: "active-press",
            exerciseId: "exercise-press",
            intensityTechnique: "super-set",
            supersetGroupId: "pair-1",
            sets: [{ id: "active-set-2", weight: 90, reps: 10, completed: true }],
          },
        ],
      })
    );
    saveTemplates([
      {
        id: "template-1",
        name: "Upper",
        muscleGroups: [
          {
            id: "group-back",
            muscleGroup: "back",
            exercises: [
              {
                id: "template-row",
                exerciseId: deletedExercise.id,
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
    saveWorkouts([
      createWorkout({
        id: "completed-workout",
        exercises: [
          {
            id: "history-row",
            exerciseId: deletedExercise.id,
            sets: [{ id: "history-set-1", weight: 110, reps: 8, completed: true }],
          },
        ],
      }),
    ]);

    deleteExerciseAndRepairReferences(deletedExercise);

    expect(getExercises().map((exercise) => exercise.id)).toEqual(["exercise-press"]);
    expect(getActiveWorkout()?.exercises).toEqual([
      expect.objectContaining({
        id: "active-press",
        exerciseId: "exercise-press",
      }),
    ]);
    expect(getActiveWorkout()?.exercises[0]).not.toHaveProperty("intensityTechnique");
    expect(getActiveWorkout()?.exercises[0]).not.toHaveProperty("supersetGroupId");
    expect(getTemplates()).toEqual([
      {
        id: "template-1",
        name: "Upper",
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
    expect(getTemplates()[0]?.muscleGroups[0]?.exercises[0]).not.toHaveProperty(
      "intensityTechnique"
    );
    expect(getTemplates()[0]?.muscleGroups[0]?.exercises[0]).not.toHaveProperty("supersetGroupId");
    expect(getWorkouts()).toEqual([
      expect.objectContaining({
        id: "completed-workout",
        exercises: [
          expect.objectContaining({
            id: "history-row",
            exerciseId: deletedExercise.id,
            exerciseSnapshot: deletedExercise,
          }),
        ],
      }),
    ]);
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
            exercises: [
              {
                id: "exercise-1",
                exerciseId: "row",
                setCount: 4,
                intensityTechnique: "super-set",
                supersetGroupId: "pair-1",
              },
            ],
          },
        ],
      })
    );
    localStorage.setItem(
      STORAGE_KEYS.WORKOUTS,
      JSON.stringify([
        createWorkout({
          id: "workout-export",
          exercises: [
            {
              id: "entry-export",
              exerciseId: "exercise-1",
              intensityTechnique: "drop-set",
              sets: [{ id: "set-export", weight: 100, reps: 8, completed: true }],
            },
          ],
        }),
      ])
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
        STORAGE_KEYS.WORKOUTS,
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
      exercises: [
        {
          id: "exercise-1",
          exerciseId: "row",
          setCount: 4,
          intensityTechnique: "super-set",
          supersetGroupId: "pair-1",
        },
      ],
    });
    expect(JSON.parse(exported.data[STORAGE_KEYS.WORKOUTS])).toEqual([
      {
        id: "workout-export",
        name: "Push Day",
        date: "2026-04-04T09:00:00.000Z",
        startTime: "2026-04-04T08:00:00.000Z",
        exercises: [
          {
            id: "entry-export",
            exerciseId: "exercise-1",
            intensityTechnique: "drop-set",
            sets: [{ id: "set-export", weight: 100, reps: 8, completed: true }],
          },
        ],
        completed: true,
      },
    ]);
  });

  it("round-trips intensity metadata through backup import", () => {
    importAllData(
      JSON.stringify({
        version: "1.0",
        appName: "Zenith",
        exportDate: "2026-04-04T12:00:00.000Z",
        data: {
          [STORAGE_KEYS.TEMPLATES]: JSON.stringify([
            {
              id: "template-1",
              name: "Upper",
              muscleGroups: [
                {
                  id: "group-1",
                  muscleGroup: "chest",
                  exercises: [
                    {
                      id: "template-ex-1",
                      exerciseId: "bench",
                      setCount: 3,
                      intensityTechnique: "super-set",
                      supersetGroupId: "pair-1",
                    },
                    {
                      id: "template-ex-2",
                      exerciseId: "row",
                      setCount: 3,
                      intensityTechnique: "super-set",
                      supersetGroupId: "pair-1",
                    },
                  ],
                },
              ],
            },
          ]),
          [STORAGE_KEYS.DRAFT_TEMPLATE]: JSON.stringify({
            name: "Draft Upper",
            exercises: [
              {
                id: "draft-ex-1",
                exerciseId: "curl",
                setCount: 2,
                intensityTechnique: "myoreps",
              },
            ],
          }),
          [STORAGE_KEYS.ACTIVE_WORKOUT]: JSON.stringify({
            id: "active-1",
            name: "Upper",
            date: "2026-04-04T09:00:00.000Z",
            startTime: "2026-04-04T08:00:00.000Z",
            exercises: [
              {
                id: "active-entry-1",
                exerciseId: "bench",
                intensityTechnique: "drop-set",
                sets: [{ id: "set-1", weight: 100, reps: 8, completed: false }],
              },
            ],
            completed: false,
          }),
          [STORAGE_KEYS.WORKOUTS]: JSON.stringify([
            {
              id: "workout-1",
              name: "History Upper",
              date: "2026-04-03T09:00:00.000Z",
              startTime: "2026-04-03T08:00:00.000Z",
              exercises: [
                {
                  id: "history-entry-1",
                  exerciseId: "bench",
                  intensityTechnique: "myorep-match",
                  sets: [{ id: "set-2", weight: 105, reps: 6, completed: true }],
                },
              ],
              completed: true,
            },
          ]),
        },
      })
    );

    expect(readStoredJsonValue(STORAGE_KEYS.TEMPLATES)).toEqual([
      {
        id: "template-1",
        name: "Upper",
        muscleGroups: [
          {
            id: "group-1",
            muscleGroup: "chest",
            exercises: [
              {
                id: "template-ex-1",
                exerciseId: "bench",
                setCount: 3,
                intensityTechnique: "super-set",
                supersetGroupId: "pair-1",
              },
              {
                id: "template-ex-2",
                exerciseId: "row",
                setCount: 3,
                intensityTechnique: "super-set",
                supersetGroupId: "pair-1",
              },
            ],
          },
        ],
      },
    ]);
    expect(readStoredJsonValue(STORAGE_KEYS.DRAFT_TEMPLATE)).toEqual({
      name: "Draft Upper",
      exercises: [
        {
          id: "draft-ex-1",
          exerciseId: "curl",
          setCount: 2,
          intensityTechnique: "myoreps",
        },
      ],
    });
    expect(readStoredJsonValue(STORAGE_KEYS.ACTIVE_WORKOUT)).toEqual({
      id: "active-1",
      name: "Upper",
      date: "2026-04-04T09:00:00.000Z",
      startTime: "2026-04-04T08:00:00.000Z",
      exercises: [
        {
          id: "active-entry-1",
          exerciseId: "bench",
          intensityTechnique: "drop-set",
          sets: [{ id: "set-1", weight: 100, reps: 8, completed: false }],
        },
      ],
      completed: false,
    });
    expect(readStoredJsonValue(STORAGE_KEYS.WORKOUTS)).toEqual([
      {
        id: "workout-1",
        name: "History Upper",
        date: "2026-04-03T09:00:00.000Z",
        startTime: "2026-04-03T08:00:00.000Z",
        exercises: [
          {
            id: "history-entry-1",
            exerciseId: "bench",
            intensityTechnique: "myorep-match",
            sets: [{ id: "set-2", weight: 105, reps: 6, completed: true }],
          },
        ],
        completed: true,
      },
    ]);
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
    expect(readStoredJsonValue(STORAGE_KEYS.TEMPLATES)).toEqual([
      {
        id: "template-1",
        name: "Full Body",
        muscleGroups: [{ id: "group-1", muscleGroup: "chest", exercises: [] }],
      },
    ]);
    expect(readStoredJsonValue(STORAGE_KEYS.ACTIVE_WORKOUT)).toMatchObject({
      id: "active-1",
    });
    expect(readStoredJsonValue(STORAGE_KEYS.SETTINGS)).toEqual({
      autoMatchWeight: true,
    });
  });

  it("omits invalid active workouts during import", () => {
    importAllData(
      JSON.stringify({
        version: "1.0",
        appName: "Zenith",
        data: {
          [STORAGE_KEYS.ACTIVE_WORKOUT]: JSON.stringify({
            id: "broken-workout",
            name: "Broken",
            completed: false,
          }),
          [STORAGE_KEYS.SETTINGS]: JSON.stringify({ autoMatchWeight: true }),
        },
      })
    );

    expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT)).toBeNull();
    expect(getActiveWorkout()).toBeNull();
    expect(readStoredJsonValue(STORAGE_KEYS.SETTINGS)).toEqual({
      autoMatchWeight: true,
    });
  });

  it("rejects invalid backup payloads before mutating storage", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

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

    expect(readStoredJsonValue(STORAGE_KEYS.SETTINGS)).toEqual({
      autoMatchWeight: false,
    });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Error parsing import file:",
      expect.any(SyntaxError)
    );
  });

  it("restores the previous snapshot when import writes fail", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

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

    expect(readStoredJsonValue(STORAGE_KEYS.SETTINGS)).toEqual({
      autoMatchWeight: false,
    });
    expect(readStoredJsonValue(STORAGE_KEYS.TEMPLATES)).toEqual([
      { id: "existing", name: "Keep", muscleGroups: [] },
    ]);
    expect(localStorage.getItem(STORAGE_KEYS.WORKOUTS)).toBeNull();
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Error writing imported data to localStorage:",
      expect.any(Error)
    );
  });
});
