import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { bicepsExercises } from "./biceps";

describe("bicepsExercises", () => {
  it("keeps the expected built-in biceps exercise ids in order", () => {
    expect(bicepsExercises.map(({ id }) => id)).toEqual([
      "default-barbell-curl-narrow-grip",
      "default-barbell-curl-normal-grip",
      "default-bayesian-curl",
      "default-cable-curl",
      "default-cable-curl-ez-bar",
      "default-cable-curl-ez-bar-wide-grip",
      "default-cable-curl-single-arm",
      "default-cable-hammer-curl",
      "default-cable-rope-twist-curl",
      "default-concentration-curl",
      "default-dumbbell-curl-2-arm",
      "default-dumbbell-curl-alternating",
      "default-dumbbell-curl-incline",
      "default-dumbbell-preacher-curl-single-arm",
      "default-dumbbell-spider-curl",
      "default-dumbbell-twist-curl",
      "default-ez-bar-curl-narrow-grip",
      "default-ez-bar-curl-normal-grip",
      "default-ez-bar-curl-wide-grip",
      "default-ez-bar-preacher-curl",
      "default-ez-bar-spider-curl",
      "default-freemotion-curl-facing-away",
      "default-freemotion-curl-facing-machine",
      "default-freemotion-curl-single-arm",
      "default-hammer-curl",
      "default-hammer-preacher-curl",
      "default-lying-biceps-dumbbell-curl",
      "default-lying-cable-curl",
      "default-lying-down-curl",
      "default-lying-dumbbell-curl",
      "default-machine-preacher-curl",
    ]);
  });

  it("keeps every biceps fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of bicepsExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("biceps");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
