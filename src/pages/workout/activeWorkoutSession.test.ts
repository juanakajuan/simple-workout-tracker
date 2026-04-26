import { describe, expect, it } from "vitest";

import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from "../../types";
import {
  addExerciseToActiveWorkout,
  addSetToWorkoutExercise,
  completeActiveWorkout,
  moveWorkoutExerciseInSession,
  removeExerciseFromActiveWorkout,
  replaceExerciseInActiveWorkout,
  skipRemainingWorkoutExerciseSets,
  updateWorkoutSet,
} from "./activeWorkoutSession";

let identifierCounter = 0;

function generateTestIdentifier(): string {
  identifierCounter += 1;
  return `generated-${identifierCounter}`;
}

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: overrides.id ?? generateTestIdentifier(),
    weight: overrides.weight ?? 0,
    reps: overrides.reps ?? 0,
    completed: overrides.completed ?? false,
    skipped: overrides.skipped,
  };
}

function createExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    id: overrides.id ?? generateTestIdentifier(),
    exerciseId: overrides.exerciseId ?? "exercise-1",
    sets: overrides.sets ?? [createSet()],
    intensityTechnique: overrides.intensityTechnique ?? null,
    supersetGroupId: overrides.supersetGroupId ?? null,
    exerciseSnapshot: overrides.exerciseSnapshot,
  };
}

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: overrides.id ?? "workout-1",
    name: overrides.name ?? "Workout",
    date: overrides.date ?? "2026-04-26T10:00:00.000Z",
    startTime: overrides.startTime ?? "2026-04-26T10:00:00.000Z",
    exercises: overrides.exercises ?? [],
    completed: overrides.completed ?? false,
    duration: overrides.duration,
    templateId: overrides.templateId,
  };
}

describe("activeWorkoutSession", () => {
  it("adds an exercise with one empty set", () => {
    identifierCounter = 0;
    const workout = createWorkout();

    const updatedWorkout = addExerciseToActiveWorkout(
      workout,
      "bench-press",
      generateTestIdentifier
    );

    expect(updatedWorkout.exercises).toHaveLength(1);
    expect(updatedWorkout.exercises[0]).toMatchObject({
      id: "generated-1",
      exerciseId: "bench-press",
      intensityTechnique: null,
      supersetGroupId: null,
    });
    expect(updatedWorkout.exercises[0]?.sets).toEqual([
      { id: "generated-2", weight: 0, reps: 0, completed: false },
    ]);
  });

  it("moves an exercise and reports source and target indexes", () => {
    const workout = createWorkout({
      exercises: [
        createExercise({ id: "first" }),
        createExercise({ id: "second" }),
        createExercise({ id: "third" }),
      ],
    });

    const result = moveWorkoutExerciseInSession(workout, "second", "down");

    expect(result?.fromIndex).toBe(1);
    expect(result?.toIndex).toBe(2);
    expect(result?.workout.exercises.map((exercise) => exercise.id)).toEqual([
      "first",
      "third",
      "second",
    ]);
  });

  it("adds a set by copying the previous set load", () => {
    identifierCounter = 0;
    const workout = createWorkout({
      exercises: [
        createExercise({
          id: "workout-exercise-1",
          sets: [createSet({ id: "set-1", weight: 135, reps: 8, completed: true })],
        }),
      ],
    });

    const updatedWorkout = addSetToWorkoutExercise(
      workout,
      "workout-exercise-1",
      generateTestIdentifier
    );

    expect(updatedWorkout.exercises[0]?.sets).toEqual([
      { id: "set-1", weight: 135, reps: 8, completed: true, skipped: undefined },
      { id: "generated-1", weight: 135, reps: 8, completed: false },
    ]);
  });

  it("auto-matches weight updates across sibling sets", () => {
    const workout = createWorkout({
      exercises: [
        createExercise({
          id: "workout-exercise-1",
          sets: [createSet({ id: "set-1", weight: 100 }), createSet({ id: "set-2", weight: 110 })],
        }),
      ],
    });

    const updatedWorkout = updateWorkoutSet(
      workout,
      "workout-exercise-1",
      "set-1",
      { weight: 125 },
      true
    );

    expect(updatedWorkout.exercises[0]?.sets.map((set) => set.weight)).toEqual([125, 125]);
  });

  it("removes paired superset state when removing an exercise", () => {
    const workout = createWorkout({
      exercises: [
        createExercise({ id: "first", intensityTechnique: "super-set", supersetGroupId: "pair-1" }),
        createExercise({
          id: "second",
          intensityTechnique: "super-set",
          supersetGroupId: "pair-1",
        }),
      ],
    });

    const updatedWorkout = removeExerciseFromActiveWorkout(workout, "first");

    expect(updatedWorkout.exercises).toHaveLength(1);
    expect(updatedWorkout.exercises[0]).toMatchObject({
      id: "second",
      intensityTechnique: null,
      supersetGroupId: null,
    });
  });

  it("replaces an exercise and resets its set progress", () => {
    const workout = createWorkout({
      exercises: [
        createExercise({
          id: "workout-exercise-1",
          exerciseId: "bench-press",
          sets: [createSet({ id: "set-1", weight: 135, reps: 8, completed: true, skipped: false })],
        }),
      ],
    });

    const result = replaceExerciseInActiveWorkout(workout, "workout-exercise-1", "incline-press");

    expect(result?.exerciseIndex).toBe(0);
    expect(result?.workout.exercises[0]).toMatchObject({ exerciseId: "incline-press" });
    expect(result?.workout.exercises[0]?.sets).toEqual([
      { id: "set-1", weight: 0, reps: 0, completed: false, skipped: false },
    ]);
  });

  it("skips only unresolved sets", () => {
    const workout = createWorkout({
      exercises: [
        createExercise({
          id: "workout-exercise-1",
          sets: [
            createSet({ id: "completed", completed: true }),
            createSet({ id: "skipped", skipped: true }),
            createSet({ id: "open" }),
          ],
        }),
      ],
    });

    const updatedWorkout = skipRemainingWorkoutExerciseSets(workout, "workout-exercise-1");

    expect(updatedWorkout.exercises[0]?.sets).toMatchObject([
      { id: "completed", completed: true, skipped: undefined },
      { id: "skipped", completed: false, skipped: true },
      { id: "open", completed: false, skipped: true },
    ]);
  });

  it("completes a workout with duration and exercise snapshots", () => {
    const exercise: Exercise = {
      id: "bench-press",
      name: "Bench Press",
      muscleGroup: "chest",
      exerciseType: "barbell",
      notes: "",
    };
    const workout = createWorkout({
      name: "Original Name",
      startTime: "2026-04-26T10:00:00.000Z",
      exercises: [createExercise({ exerciseId: "bench-press" })],
    });

    const completedWorkout = completeActiveWorkout(
      workout,
      "Edited Name",
      new Map([[exercise.id, exercise]]),
      new Date("2026-04-26T10:05:30.000Z")
    );

    expect(completedWorkout).toMatchObject({
      name: "Edited Name",
      date: "2026-04-26T10:05:30.000Z",
      duration: 330,
      completed: true,
    });
    expect(completedWorkout.exercises[0]?.exerciseSnapshot).toEqual(exercise);
  });
});
