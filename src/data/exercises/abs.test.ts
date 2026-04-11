import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { absExercises } from "./abs";

describe("absExercises", () => {
  it("keeps the expected built-in abs exercise ids in order", () => {
    expect(absExercises.map(({ id }) => id)).toEqual([
      "default-ab-wheel",
      "default-cable-rope-crunch",
      "default-hanging-knee-raise",
      "default-hanging-straight-leg-raise",
      "default-machine-crunch",
      "default-modified-candlestick",
      "default-reaching-sit-up",
      "default-slant-board-sit-up-weighted",
      "default-v-up-weighted",
    ]);
  });

  it("keeps every abs fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of absExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("abs");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
