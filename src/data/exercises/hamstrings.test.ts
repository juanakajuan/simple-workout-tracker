import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { hamstringsExercises } from "./hamstrings";

describe("hamstringsExercises", () => {
  it("keeps the expected built-in hamstrings exercise ids in order", () => {
    expect(hamstringsExercises.map(({ id }) => id)).toEqual([
      "default-back-raise-45-degree",
      "default-back-raise-glute-ham-deck",
      "default-barbell-good-morning-cambered-bar",
      "default-barbell-good-morning-high-bar",
      "default-barbell-good-morning-low-bar",
      "default-barbell-good-morning-safety-bar",
      "default-dumbbell-stiff-legged-deadlift",
      "default-lying-leg-curl",
      "default-nordic-curl",
      "default-seated-leg-curl",
      "default-single-leg-romanian-deadlift",
      "default-single-leg-leg-curl",
      "default-smith-machine-good-morning",
      "default-stiff-legged-deadlift",
    ]);
  });

  it("keeps every hamstrings fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of hamstringsExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("hamstrings");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
