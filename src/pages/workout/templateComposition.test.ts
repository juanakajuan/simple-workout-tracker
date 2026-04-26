import { describe, expect, it } from "vitest";

import type { Exercise, TemplateExercise, WorkoutTemplate } from "../../types";
import {
  appendTemplateExercise,
  buildTemplateMuscleGroups,
  createTemplateExercise,
  flattenTemplateExercises,
  getSupersetValidationError,
  insertTemplateExerciseAtPosition,
  moveTemplateExercise,
  pairTemplateExercisesAsSuperset,
  removeTemplateExercise,
  replaceTemplateExercise,
  unpairTemplateExerciseSuperset,
  updateTemplateExerciseIntensity,
  updateTemplateExerciseSetCount,
  updateTemplateExercises,
} from "./templateComposition";

let identifierCounter = 0;

function generateTestIdentifier(): string {
  identifierCounter += 1;
  return `generated-${identifierCounter}`;
}

function createExercise(id: string, muscleGroup: Exercise["muscleGroup"]): Exercise {
  return {
    id,
    name: id,
    muscleGroup,
    exerciseType: "machine",
    notes: "",
  };
}

function createTemplateExerciseFixture(overrides: Partial<TemplateExercise>): TemplateExercise {
  return {
    id: overrides.id ?? generateTestIdentifier(),
    exerciseId: overrides.exerciseId ?? "exercise-1",
    setCount: overrides.setCount ?? 3,
    intensityTechnique: overrides.intensityTechnique,
    supersetGroupId: overrides.supersetGroupId,
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

describe("templateComposition", () => {
  it("flattens and rebuilds template muscle groups by contiguous exercise muscle groups", () => {
    identifierCounter = 0;
    const chestPress = createExercise("chest-press", "chest");
    const chestFly = createExercise("chest-fly", "chest");
    const row = createExercise("row", "back");
    const exercisesById = new Map([
      [chestPress.id, chestPress],
      [chestFly.id, chestFly],
      [row.id, row],
    ]);
    const templateExercises = [
      createTemplateExerciseFixture({ id: "template-exercise-1", exerciseId: "chest-press" }),
      createTemplateExerciseFixture({ id: "template-exercise-2", exerciseId: "chest-fly" }),
      createTemplateExerciseFixture({ id: "template-exercise-3", exerciseId: "row" }),
    ];

    const muscleGroups = buildTemplateMuscleGroups(
      templateExercises,
      exercisesById,
      generateTestIdentifier
    );
    const flattenedTemplate = flattenTemplateExercises({
      id: "template-1",
      name: "Template",
      muscleGroups,
    });

    expect(muscleGroups).toMatchObject([
      {
        id: "generated-1",
        muscleGroup: "chest",
        exercises: [{ id: "template-exercise-1" }, { id: "template-exercise-2" }],
      },
      { id: "generated-2", muscleGroup: "back", exercises: [{ id: "template-exercise-3" }] },
    ]);
    expect(flattenedTemplate.map((exercise) => exercise.id)).toEqual([
      "template-exercise-1",
      "template-exercise-2",
      "template-exercise-3",
    ]);
  });

  it("composes flat template exercise mutations", () => {
    identifierCounter = 0;
    const baseTemplateExercise = createTemplateExercise("chest-press", generateTestIdentifier);
    const appendedTemplateExercise = createTemplateExercise("row", generateTestIdentifier);
    const insertedTemplateExercise = createTemplateExercise("curl", generateTestIdentifier);

    const updatedTemplateExercises = updateTemplateExerciseSetCount(
      moveTemplateExercise(
        insertTemplateExerciseAtPosition(
          appendTemplateExercise([baseTemplateExercise], appendedTemplateExercise),
          insertedTemplateExercise,
          1
        ),
        insertedTemplateExercise.id,
        "up"
      ),
      insertedTemplateExercise.id,
      2
    );
    const replacedTemplateExercises = replaceTemplateExercise(
      updatedTemplateExercises,
      insertedTemplateExercise.id,
      "hammer-curl"
    );

    expect(replacedTemplateExercises.map((exercise) => exercise.exerciseId)).toEqual([
      "hammer-curl",
      "chest-press",
      "row",
    ]);
    expect(replacedTemplateExercises[0]?.setCount).toBe(5);
  });

  it("bounds set-count updates", () => {
    const templateExercises = [
      createTemplateExerciseFixture({ id: "low", setCount: 1 }),
      createTemplateExerciseFixture({ id: "high", setCount: 20 }),
    ];

    expect(updateTemplateExerciseSetCount(templateExercises, "low", -1)[0]?.setCount).toBe(1);
    expect(updateTemplateExerciseSetCount(templateExercises, "high", 1)[1]?.setCount).toBe(20);
  });

  it("pairs, validates, and unpairs supersets", () => {
    identifierCounter = 0;
    const templateExercises = [
      createTemplateExerciseFixture({ id: "first" }),
      createTemplateExerciseFixture({ id: "second" }),
    ];
    const pairedTemplateExercises = pairTemplateExercisesAsSuperset(
      updateTemplateExerciseIntensity(templateExercises, "first", "super-set"),
      "first",
      "second",
      generateTestIdentifier
    );

    expect(getSupersetValidationError(pairedTemplateExercises)).toBe("");
    expect(pairedTemplateExercises).toMatchObject([
      { intensityTechnique: "super-set", supersetGroupId: "generated-1" },
      { intensityTechnique: "super-set", supersetGroupId: "generated-1" },
    ]);
    expect(
      getSupersetValidationError(unpairTemplateExerciseSuperset(pairedTemplateExercises, "first"))
    ).toBe("Please pair every superset exercise before saving");
  });

  it("updates a stored template through the flat-template seam", () => {
    identifierCounter = 0;
    const chestPress = createExercise("chest-press", "chest");
    const row = createExercise("row", "back");
    const exercisesById = new Map([
      [chestPress.id, chestPress],
      [row.id, row],
    ]);
    const template = createTemplate([
      createTemplateExerciseFixture({ id: "template-exercise-1", exerciseId: "chest-press" }),
    ]);

    const updatedTemplates = updateTemplateExercises(
      [template],
      "template-1",
      exercisesById,
      generateTestIdentifier,
      (templateExercises) =>
        appendTemplateExercise(
          templateExercises,
          createTemplateExerciseFixture({ id: "template-exercise-2", exerciseId: "row" })
        )
    );

    expect(updatedTemplates[0]?.muscleGroups).toMatchObject([
      { muscleGroup: "chest", exercises: [{ id: "template-exercise-1" }] },
      { muscleGroup: "back", exercises: [{ id: "template-exercise-2" }] },
    ]);
  });

  it("removes paired intensity state when removing a template exercise", () => {
    const templateExercises = [
      createTemplateExerciseFixture({
        id: "first",
        intensityTechnique: "super-set",
        supersetGroupId: "pair-1",
      }),
      createTemplateExerciseFixture({
        id: "second",
        intensityTechnique: "super-set",
        supersetGroupId: "pair-1",
      }),
    ];

    expect(removeTemplateExercise(templateExercises, "first")).toMatchObject([
      { id: "second", intensityTechnique: null, supersetGroupId: null },
    ]);
  });
});
