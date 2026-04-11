import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { trapsExercises } from "./traps";

describe("trapsExercises", () => {
  it("keeps the expected built-in traps exercise ids in order", () => {
    expect(trapsExercises.map(({ id }) => id)).toEqual([
      "default-barbell-bent-over-shrug",
      "default-barbell-shrug",
      "default-cable-bent-over-shrug",
      "default-cable-shrug",
      "default-cable-side-shrug",
      "default-cable-single-arm-side-shrug",
      "default-dumbbell-bent-over-shrug",
      "default-dumbbell-leaning-shrug",
      "default-dumbbell-shrug",
      "default-dumbbell-shrug-seated",
      "default-machine-shrug",
      "default-smith-machine-shrug",
    ]);
  });

  it("keeps every traps fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of trapsExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("traps");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
