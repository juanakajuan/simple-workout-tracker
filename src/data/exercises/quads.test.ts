import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { quadsExercises } from "./quads";

describe("quadsExercises", () => {
  it("keeps the expected built-in quads exercise ids in order", () => {
    expect(quadsExercises.map(({ id }) => id)).toEqual([
      "default-barbell-split-squat",
      "default-barbell-squat-cambered-bar",
      "default-barbell-squat-close-stance-feet-forward",
      "default-barbell-squat-high-bar",
      "default-barbell-squat-narrow-stance",
      "default-barbell-squat-safety-bar",
      "default-belt-squat",
      "default-bodyweight-squat",
      "default-bulgarian-split-squat-quad-focused",
      "default-dumbbell-front-squat",
      "default-front-squat",
      "default-front-squat-cross-grip",
      "default-goblet-squat",
      "default-hack-squat",
      "default-hip-adduction",
      "default-leg-extension",
      "default-leg-press",
      "default-pendulum-squat",
      "default-single-leg-extension",
      "default-single-leg-press",
      "default-sissy-squat-machine",
      "default-sissy-squat-no-machine",
      "default-smith-machine-squat-feet-forward",
      "default-walking-lunges-quad-focused-barbell",
      "default-walking-lunges-quad-focused-bodyweight",
      "default-walking-lunges-quad-focused-dumbbell",
    ]);
  });

  it("keeps every quads fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of quadsExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("quads");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
