import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { chestExercises } from "./chest";

describe("chestExercises", () => {
  it("keeps the expected built-in chest exercise ids in order", () => {
    expect(chestExercises.map(({ id }) => id)).toEqual([
      "default-bench-press-decline-barbell",
      "default-bench-press-incline-medium-grip",
      "default-bench-press-incline-narrow-grip",
      "default-bench-press-incline-wide-grip",
      "default-bench-press-medium-grip",
      "default-bench-press-narrow-grip",
      "default-bench-press-wide-grip",
      "default-cable-chest-press",
      "default-cable-flye",
      "default-cable-flye-bent-over",
      "default-cable-flye-high",
      "default-cable-flye-seated",
      "default-cable-flye-underhand",
      "default-dip-chest-focused",
      "default-dip-weighted-chest-focused",
      "default-dumbbell-flye-flat",
      "default-dumbbell-flye-incline",
      "default-dumbbell-press-flat",
      "default-dumbbell-press-incline",
      "default-dumbbell-press-low-incline",
      "default-dumbbell-press-flye-flat",
      "default-dumbbell-press-flye-incline",
      "default-hammer-machine-chest-press-flat",
      "default-hammer-machine-chest-press-incline",
      "default-machine-chest-press",
      "default-machine-chest-press-incline",
      "default-machine-flye",
      "default-pec-dec-flye",
      "default-pushup",
      "default-pushup-deficit",
      "default-pushup-narrow-grip",
      "default-smith-machine-bench-press-medium-grip",
      "default-smith-machine-bench-press-narrow-grip",
      "default-smith-machine-bench-press-wide-grip",
      "default-smith-machine-press-incline-medium-grip",
      "default-smith-machine-press-incline-wide-grip",
    ]);
  });

  it("keeps every chest fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of chestExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("chest");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
