import { describe, expect, it } from "vitest";

import {
  EXERCISE_TYPES,
  MUSCLE_GROUPS,
  exerciseTypeLabels,
  getMuscleGroupClassName,
  muscleGroupColors,
  muscleGroupLabels,
} from "./index";

describe("types metadata", () => {
  it("keeps muscle-group labels and colors aligned with supported muscle groups", () => {
    expect(Object.keys(muscleGroupLabels)).toEqual(MUSCLE_GROUPS);
    expect(Object.keys(muscleGroupColors).sort()).toEqual([...MUSCLE_GROUPS].sort());

    for (const muscleGroup of MUSCLE_GROUPS) {
      expect(muscleGroupLabels[muscleGroup]).toMatch(/\S/);
      expect(muscleGroupColors[muscleGroup]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("keeps exercise-type labels and generated muscle-group classes in sync", () => {
    expect(Object.keys(exerciseTypeLabels)).toEqual(EXERCISE_TYPES);

    for (const muscleGroup of MUSCLE_GROUPS) {
      expect(getMuscleGroupClassName(muscleGroup)).toBe(`tag-muscle-${muscleGroup}`);
    }
  });
});
