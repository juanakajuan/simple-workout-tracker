import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { tricepsExercises } from "./triceps";

describe("tricepsExercises", () => {
  it("keeps the expected built-in triceps exercise ids in order", () => {
    expect(tricepsExercises.map(({ id }) => id)).toEqual([
      "default-assisted-dip",
      "default-barbell-overhead-triceps-extension",
      "default-barbell-overhead-triceps-extension-seated",
      "default-barbell-skullcrusher",
      "default-bench-press-close-grip",
      "default-cable-overhead-triceps-extension",
      "default-cable-overhead-triceps-extension-rope",
      "default-cable-tricep-kickback",
      "default-cable-triceps-pushdown-bar",
      "default-cable-triceps-pushdown-rope",
      "default-cable-triceps-pushdown-single-arm",
      "default-dips-triceps-focused",
      "default-dip-machine",
      "default-dumbbell-overhead-extension",
      "default-dumbbell-overhead-extension-single-arm",
      "default-dumbbell-skullcrusher",
      "default-ez-bar-overhead-triceps-extension",
      "default-ez-bar-overhead-triceps-extension-seated",
      "default-ez-bar-skullcrusher",
      "default-inverted-skullcrusher",
      "default-jm-press",
      "default-machine-triceps-extension",
      "default-machine-triceps-pushdown",
      "default-smith-machine-jm-press",
      "default-smith-machine-skullcrusher",
    ]);
  });

  it("keeps every triceps fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of tricepsExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("triceps");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
