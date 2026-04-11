import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { glutesExercises } from "./glutes";

describe("glutesExercises", () => {
  it("keeps the expected built-in glutes exercise ids in order", () => {
    expect(glutesExercises.map(({ id }) => id)).toEqual([
      "default-barbell-hip-thrust",
      "default-barbell-squat-sumo-stance",
      "default-belt-squat-wide-stance",
      "default-bulgarian-split-squat-glute-focused",
      "default-cable-glute-kickback",
      "default-cable-kickback",
      "default-cable-pull-through",
      "default-deadlift-glutes",
      "default-deadlift-deficit-25s",
      "default-deadlift-deficit",
      "default-deadlift-sumo-stance",
      "default-dumbbell-hip-thrust-single-leg",
      "default-dumbbell-split-squat",
      "default-front-foot-elevated-smith-lunge",
      "default-hip-abduction-machine",
      "default-machine-glute-kickback",
      "default-machine-hip-thrust",
      "default-reverse-hyper",
      "default-reverse-lunge-barbell",
      "default-reverse-lunge-dumbbell",
      "default-smith-machine-split-squat",
      "default-trap-bar-deadlift",
      "default-walking-lunges-glute-focused-barbell",
      "default-walking-lunges-glute-focused-bodyweight",
      "default-walking-lunges-glute-focused-dumbbell",
    ]);
  });

  it("keeps every glutes fixture in a valid normalized shape", () => {
    const ids = new Set<string>();

    for (const exercise of glutesExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(ids.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("glutes");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      ids.add(exercise.id);
    }
  });
});
