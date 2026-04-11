import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { forearmsExercises } from "./forearms";

describe("forearmsExercises", () => {
  it("keeps the expected built-in forearms exercise ids in order", () => {
    expect(forearmsExercises.map(({ id }) => id)).toEqual([
      "default-barbell-standing-wrist-curl",
      "default-cable-wrist-curl",
      "default-dumbbell-bench-wrist-curl",
      "default-dumbbell-standing-wrist-curl",
      "default-grip-roller",
      "default-reverse-curl",
    ]);
  });

  it("keeps every forearms fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of forearmsExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("forearms");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
