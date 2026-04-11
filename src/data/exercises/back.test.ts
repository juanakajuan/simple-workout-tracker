import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { backExercises } from "./back";

describe("backExercises", () => {
  it("keeps the expected built-in back exercise ids in order", () => {
    expect(backExercises.map(({ id }) => id)).toEqual([
      "default-assisted-pullup-normal-grip",
      "default-assisted-pullup-parallel-grip",
      "default-assisted-pullup-underhand-grip",
      "default-assisted-pullup-wide-grip",
      "default-back-extension",
      "default-barbell-bent-over-row",
      "default-barbell-flexion-row",
      "default-barbell-row-to-chest",
      "default-cable-flexion-row",
      "default-cable-pullover",
      "default-cambered-bar-row",
      "default-chest-supported-row",
      "default-deadlift",
      "default-dumbbell-pullover",
      "default-dumbbell-row-2-arm",
      "default-dumbbell-row-2-arm-incline",
      "default-dumbbell-row-single-arm-supported",
      "default-dumbbell-row-to-hips",
      "default-ez-bar-row-underhand",
      "default-hammer-machine-row-high",
      "default-hammer-machine-row-low",
      "default-inverted-row",
      "default-landmine-row",
      "default-machine-chest-supported-row",
      "default-machine-pulldown",
      "default-machine-pullover",
      "default-meadows-row",
      "default-pulldown-narrow-grip",
      "default-pulldown-normal-grip",
      "default-pulldown-parallel-grip",
      "default-pulldown-single-arm",
      "default-pulldown-straight-arm",
      "default-pulldown-underhand-grip",
      "default-pulldown-upright-torso-to-abs",
      "default-pulldown-wide-grip",
      "default-pullup-normal-grip",
      "default-pullup-parallel-grip",
      "default-pullup-underhand-grip",
      "default-pullup-weighted-normal-grip",
      "default-pullup-weighted-parallel-grip",
      "default-pullup-weighted-underhand-grip",
      "default-pullup-weighted-wide-grip",
      "default-pullup-wide-grip",
      "default-seal-row",
      "default-seated-cable-row",
      "default-seated-cable-row-single-arm",
      "default-smith-machine-row",
      "default-t-bar-row",
    ]);
  });

  it("keeps every back fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of backExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("back");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
