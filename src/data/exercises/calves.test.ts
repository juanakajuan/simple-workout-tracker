import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { calvesExercises } from "./calves";

describe("calvesExercises", () => {
  it("keeps the expected built-in calves exercise ids in order", () => {
    expect(calvesExercises.map(({ id }) => id)).toEqual([
      "default-belt-squat-calves",
      "default-calf-machine",
      "default-leg-press-calves",
      "default-smith-machine-calves",
      "default-stair-calves",
      "default-stair-calves-single-leg",
      "default-standing-calf-raise",
    ]);
  });

  it("keeps every calves fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of calvesExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("calves");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
