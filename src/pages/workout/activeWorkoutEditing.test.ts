import { describe, expect, it } from "vitest";

import type {
  Exercise,
  TemplateExercise,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
} from "../../types";
import {
  addExerciseToActiveWorkoutEditingState,
  addSetToActiveWorkoutEditingState,
  moveExerciseInActiveWorkoutEditingState,
  removeExerciseFromActiveWorkoutEditingState,
  removeSetFromActiveWorkoutEditingState,
  replaceExerciseInActiveWorkoutEditingState,
  type ActiveWorkoutEditingResult,
  type ActiveWorkoutEditingState,
} from "./activeWorkoutEditing";

let identifierCounter = 0;

function generateTestIdentifier(): string {
  identifierCounter += 1;
  return `generated-${identifierCounter}`;
}

function createWorkoutSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: overrides.id ?? generateTestIdentifier(),
    weight: overrides.weight ?? 0,
    reps: overrides.reps ?? 0,
    completed: overrides.completed ?? false,
    skipped: overrides.skipped,
  };
}

function createWorkoutExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    id: overrides.id ?? generateTestIdentifier(),
    exerciseId: overrides.exerciseId ?? "bench-press",
    sets: overrides.sets ?? [createWorkoutSet()],
    intensityTechnique: overrides.intensityTechnique ?? null,
    supersetGroupId: overrides.supersetGroupId ?? null,
    exerciseSnapshot: overrides.exerciseSnapshot,
  };
}

function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: overrides.id ?? "workout-1",
    name: overrides.name ?? "Workout",
    date: overrides.date ?? "2026-05-03T10:00:00.000Z",
    startTime: overrides.startTime ?? "2026-05-03T10:00:00.000Z",
    exercises: overrides.exercises ?? [],
    completed: overrides.completed ?? false,
    duration: overrides.duration,
    templateId: overrides.templateId,
  };
}

function createCatalogExercise(
  exerciseIdentifier: string,
  muscleGroup: Exercise["muscleGroup"]
): Exercise {
  return {
    id: exerciseIdentifier,
    name: exerciseIdentifier,
    muscleGroup,
    exerciseType: "machine",
    notes: "",
  };
}

function createTemplateExercise(overrides: Partial<TemplateExercise> = {}): TemplateExercise {
  return {
    id: overrides.id ?? generateTestIdentifier(),
    exerciseId: overrides.exerciseId ?? "bench-press",
    setCount: overrides.setCount ?? 3,
    intensityTechnique: overrides.intensityTechnique ?? null,
    supersetGroupId: overrides.supersetGroupId ?? null,
  };
}

function createTemplate(templateExercises: TemplateExercise[]): WorkoutTemplate {
  return {
    id: "template-1",
    name: "Template",
    muscleGroups: [
      {
        id: "group-1",
        muscleGroup: "chest",
        exercises: templateExercises,
      },
    ],
  };
}

function flattenTemplate(template: WorkoutTemplate): TemplateExercise[] {
  return template.muscleGroups.flatMap((muscleGroup) => muscleGroup.exercises);
}

function createEditingState(
  workout: Workout,
  templates: WorkoutTemplate[],
  exercises: Exercise[]
): ActiveWorkoutEditingState {
  return {
    workout,
    templates,
    exercisesByIdentifier: new Map(exercises.map((exercise) => [exercise.id, exercise])),
    generateIdentifier: generateTestIdentifier,
  };
}

function requireEditingResult(
  result: ActiveWorkoutEditingResult | null
): ActiveWorkoutEditingResult {
  if (!result) {
    throw new Error("Expected the active workout edit to succeed.");
  }

  return result;
}

function requireFirstTemplate(result: ActiveWorkoutEditingResult): WorkoutTemplate {
  const firstTemplate = result.templates[0];
  if (!firstTemplate) {
    throw new Error("Expected the active workout edit to return a template.");
  }

  return firstTemplate;
}

describe("activeWorkoutEditing", () => {
  it("adds an exercise to the active workout and source template when requested", () => {
    identifierCounter = 0;
    const benchPress = createCatalogExercise("bench-press", "chest");
    const row = createCatalogExercise("row", "back");
    const template = createTemplate([
      createTemplateExercise({ id: "template-exercise-1", exerciseId: benchPress.id }),
    ]);
    const workout = createWorkout({
      templateId: template.id,
      exercises: [createWorkoutExercise({ id: "workout-exercise-1", exerciseId: benchPress.id })],
    });

    const result = addExerciseToActiveWorkoutEditingState(
      createEditingState(workout, [template], [benchPress, row]),
      row.id,
      "synchronizeTemplate"
    );

    expect(result.workout.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      benchPress.id,
      row.id,
    ]);
    expect(result.workout.exercises[1]?.sets).toEqual([
      { id: expect.any(String), weight: 0, reps: 0, completed: false },
    ]);
    const updatedTemplate = requireFirstTemplate(result);
    expect(updatedTemplate.muscleGroups.map((muscleGroup) => muscleGroup.muscleGroup)).toEqual([
      "chest",
      "back",
    ]);
    expect(flattenTemplate(updatedTemplate)).toMatchObject([
      { id: "template-exercise-1", exerciseId: benchPress.id, setCount: 3 },
      { id: expect.any(String), exerciseId: row.id, setCount: 3 },
    ]);
  });

  it("replaces an active workout exercise without changing the template when requested", () => {
    const benchPress = createCatalogExercise("bench-press", "chest");
    const fly = createCatalogExercise("fly", "chest");
    const template = createTemplate([
      createTemplateExercise({ id: "template-exercise-1", exerciseId: benchPress.id }),
    ]);
    const workout = createWorkout({
      templateId: template.id,
      exercises: [
        createWorkoutExercise({
          id: "workout-exercise-1",
          exerciseId: benchPress.id,
          sets: [
            createWorkoutSet({ id: "set-1", weight: 135, reps: 8, completed: true }),
            createWorkoutSet({ id: "set-2", weight: 135, reps: 6, completed: false }),
          ],
        }),
      ],
    });

    const result = replaceExerciseInActiveWorkoutEditingState(
      createEditingState(workout, [template], [benchPress, fly]),
      "workout-exercise-1",
      fly.id,
      "leaveTemplateUnchanged"
    );
    const requiredResult = requireEditingResult(result);

    expect(requiredResult.workout.exercises[0]).toMatchObject({
      id: "workout-exercise-1",
      exerciseId: fly.id,
      sets: [
        { id: "set-1", weight: 0, reps: 0, completed: false },
        { id: "set-2", weight: 0, reps: 0, completed: false },
      ],
    });
    expect(flattenTemplate(requireFirstTemplate(requiredResult))[0]?.exerciseId).toBe(
      benchPress.id
    );
  });

  it("automatically synchronizes template positions and set counts", () => {
    identifierCounter = 0;
    const benchPress = createCatalogExercise("bench-press", "chest");
    const row = createCatalogExercise("row", "back");
    const template = createTemplate([
      createTemplateExercise({ id: "template-exercise-1", exerciseId: benchPress.id }),
      createTemplateExercise({ id: "template-exercise-2", exerciseId: row.id }),
    ]);
    const workout = createWorkout({
      templateId: template.id,
      exercises: [
        createWorkoutExercise({ id: "workout-exercise-1", exerciseId: benchPress.id }),
        createWorkoutExercise({ id: "workout-exercise-2", exerciseId: row.id }),
      ],
    });
    const firstState = createEditingState(workout, [template], [benchPress, row]);

    const moveResult = moveExerciseInActiveWorkoutEditingState(
      firstState,
      "workout-exercise-1",
      "down"
    );
    const requiredMoveResult = requireEditingResult(moveResult);
    expect(requiredMoveResult.workout.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      row.id,
      benchPress.id,
    ]);
    expect(
      flattenTemplate(requireFirstTemplate(requiredMoveResult)).map(
        (exercise) => exercise.exerciseId
      )
    ).toEqual([row.id, benchPress.id]);

    const addSetResult = addSetToActiveWorkoutEditingState(
      createEditingState(requiredMoveResult.workout, requiredMoveResult.templates, [
        benchPress,
        row,
      ]),
      "workout-exercise-2"
    );
    const requiredAddSetResult = requireEditingResult(addSetResult);
    expect(requiredAddSetResult.workout.exercises[0]?.sets).toHaveLength(2);
    expect(flattenTemplate(requireFirstTemplate(requiredAddSetResult))[0]?.setCount).toBe(2);

    const firstWorkoutSetIdentifier = requiredAddSetResult.workout.exercises[0]?.sets[0]?.id;
    if (!firstWorkoutSetIdentifier) {
      throw new Error("Expected the edited workout to keep its first set.");
    }

    const removeSetResult = removeSetFromActiveWorkoutEditingState(
      createEditingState(requiredAddSetResult.workout, requiredAddSetResult.templates, [
        benchPress,
        row,
      ]),
      "workout-exercise-2",
      firstWorkoutSetIdentifier
    );
    const requiredRemoveSetResult = requireEditingResult(removeSetResult);
    expect(requiredRemoveSetResult.workout.exercises[0]?.sets).toHaveLength(1);
    expect(flattenTemplate(requireFirstTemplate(requiredRemoveSetResult))[0]?.setCount).toBe(1);
  });

  it("removes an exercise from the active workout and source template when requested", () => {
    const benchPress = createCatalogExercise("bench-press", "chest");
    const row = createCatalogExercise("row", "back");
    const template = createTemplate([
      createTemplateExercise({ id: "template-exercise-1", exerciseId: benchPress.id }),
      createTemplateExercise({ id: "template-exercise-2", exerciseId: row.id }),
    ]);
    const workout = createWorkout({
      templateId: template.id,
      exercises: [
        createWorkoutExercise({ id: "workout-exercise-1", exerciseId: benchPress.id }),
        createWorkoutExercise({ id: "workout-exercise-2", exerciseId: row.id }),
      ],
    });

    const result = removeExerciseFromActiveWorkoutEditingState(
      createEditingState(workout, [template], [benchPress, row]),
      "workout-exercise-2",
      "synchronizeTemplate"
    );
    const requiredResult = requireEditingResult(result);

    expect(requiredResult.workout.exercises.map((exercise) => exercise.exerciseId)).toEqual([
      benchPress.id,
    ]);
    expect(
      flattenTemplate(requireFirstTemplate(requiredResult)).map((exercise) => exercise.exerciseId)
    ).toEqual([benchPress.id]);
  });
});
