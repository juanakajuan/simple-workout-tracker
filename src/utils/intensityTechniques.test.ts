import { describe, expect, it } from "vitest";

import type { TemplateExercise } from "../types";

import {
  getSupersetDisplayLabels,
  getSupersetPartnerId,
  pairExercisesAsSuperset,
  removeExerciseWithIntensityCleanup,
  setExerciseIntensityTechnique,
  unpairSupersetExercise,
} from "./intensityTechniques";

function createTemplateExercise(
  overrides: Partial<TemplateExercise> & Pick<TemplateExercise, "id">
): TemplateExercise {
  return {
    id: overrides.id,
    exerciseId: overrides.exerciseId ?? overrides.id,
    setCount: overrides.setCount ?? 3,
    intensityTechnique: overrides.intensityTechnique ?? null,
    supersetGroupId: overrides.supersetGroupId ?? null,
  };
}

describe("intensity technique helpers", () => {
  it("pairs two exercises into the same superset and clears prior links", () => {
    const exercises = [
      createTemplateExercise({
        id: "exercise-1",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({
        id: "exercise-2",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({ id: "exercise-3" }),
    ];

    expect(pairExercisesAsSuperset(exercises, "exercise-1", "exercise-3", "b")).toEqual([
      createTemplateExercise({
        id: "exercise-1",
        intensityTechnique: "super-set",
        supersetGroupId: "b",
      }),
      createTemplateExercise({ id: "exercise-2" }),
      createTemplateExercise({
        id: "exercise-3",
        intensityTechnique: "super-set",
        supersetGroupId: "b",
      }),
    ]);
  });

  it("clears both sides of a superset when changing one exercise back to a standalone technique", () => {
    const exercises = [
      createTemplateExercise({
        id: "exercise-1",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({
        id: "exercise-2",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
    ];

    expect(setExerciseIntensityTechnique(exercises, "exercise-1", "drop-set")).toEqual([
      createTemplateExercise({ id: "exercise-1", intensityTechnique: "drop-set" }),
      createTemplateExercise({ id: "exercise-2" }),
    ]);
  });

  it("returns the paired exercise id for a superset member", () => {
    const exercises = [
      createTemplateExercise({
        id: "exercise-1",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({
        id: "exercise-2",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
    ];

    expect(getSupersetPartnerId(exercises, "exercise-1")).toBe("exercise-2");
  });

  it("cleans up the remaining exercise when deleting a superset member", () => {
    const exercises = [
      createTemplateExercise({
        id: "exercise-1",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({
        id: "exercise-2",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
    ];

    expect(removeExerciseWithIntensityCleanup(exercises, "exercise-1")).toEqual([
      createTemplateExercise({ id: "exercise-2" }),
    ]);
  });

  it("keeps the current exercise marked as a superset when its partner is cleared", () => {
    const exercises = [
      createTemplateExercise({
        id: "exercise-1",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({
        id: "exercise-2",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
    ];

    expect(unpairSupersetExercise(exercises, "exercise-1")).toEqual([
      createTemplateExercise({ id: "exercise-1", intensityTechnique: "super-set" }),
      createTemplateExercise({ id: "exercise-2" }),
    ]);
  });

  it("builds stable display labels for visible supersets", () => {
    const exercises = [
      createTemplateExercise({
        id: "exercise-1",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({
        id: "exercise-2",
        intensityTechnique: "super-set",
        supersetGroupId: "a",
      }),
      createTemplateExercise({ id: "exercise-3", intensityTechnique: "drop-set" }),
      createTemplateExercise({
        id: "exercise-4",
        intensityTechnique: "super-set",
        supersetGroupId: "b",
      }),
      createTemplateExercise({
        id: "exercise-5",
        intensityTechnique: "super-set",
        supersetGroupId: "b",
      }),
    ];

    expect(getSupersetDisplayLabels(exercises)).toEqual({
      a: "Superset 1",
      b: "Superset 2",
    });
  });
});
