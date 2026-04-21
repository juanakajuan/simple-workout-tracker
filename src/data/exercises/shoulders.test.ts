import { describe, expect, it } from "vitest";

import { EXERCISE_TYPES } from "../../types";

import { shouldersExercises } from "./shoulders";

const expectedShouldersExerciseIds = [
  "default-arnold-press",
  "default-barbell-bent-over-shrug",
  "default-barbell-facepull",
  "default-barbell-front-raise",
  "default-barbell-front-raise-ez-bar-underhand",
  "default-barbell-shoulder-press-seated",
  "default-barbell-shoulder-press-standing",
  "default-barbell-shrug",
  "default-barbell-upright-row",
  "default-cable-bent-over-shrug",
  "default-cable-cross-body-bent-lateral-raise",
  "default-cable-cross-body-lateral-raise",
  "default-cable-front-raise-underhand",
  "default-cable-lateral-raise",
  "default-cable-lateral-raise-single-arm",
  "default-cable-leaning-lateral-raise",
  "default-cable-rope-facepull",
  "default-cable-rope-facepull-kneeling",
  "default-cable-shrug",
  "default-cable-side-shrug",
  "default-cable-single-arm-rear-delt-raise",
  "default-cable-single-arm-side-shrug",
  "default-cable-upright-row",
  "default-dumbbell-bent-lateral-raise",
  "default-dumbbell-bent-over-shrug",
  "default-dumbbell-facepull",
  "default-dumbbell-facepull-incline",
  "default-dumbbell-front-raise",
  "default-dumbbell-lateral-raise",
  "default-dumbbell-lateral-raise-incline",
  "default-dumbbell-lateral-raise-super-rom",
  "default-dumbbell-lateral-raise-thumbs-down",
  "default-dumbbell-lateral-raise-top-hold",
  "default-dumbbell-leaning-shrug",
  "default-dumbbell-press-high-incline",
  "default-dumbbell-shoulder-press-seated",
  "default-dumbbell-shoulder-press-standing",
  "default-dumbbell-shrug",
  "default-dumbbell-shrug-seated",
  "default-dumbbell-upright-row",
  "default-freemotion-rear-delt-flyes",
  "default-freemotion-rear-delt-flyes-paused",
  "default-freemotion-y-raises",
  "default-freemotion-y-raises-paused",
  "default-machine-lateral-raise",
  "default-machine-reverse-flye",
  "default-machine-shoulder-press",
  "default-one-arm-leaning-lateral-raise",
  "default-smith-machine-shoulder-press-seated",
  "default-smith-machine-upright-row",
];

describe("shouldersExercises", () => {
  it("keeps the expected built-in shoulders exercise ids in order", () => {
    expect(shouldersExercises.map(({ id }) => id)).toEqual(expectedShouldersExerciseIds);
  });

  it("keeps every shoulders fixture in a valid normalized shape", () => {
    const seenExerciseIds = new Set<string>();

    for (const exercise of shouldersExercises) {
      expect(exercise.id.startsWith("default-")).toBe(true);
      expect(seenExerciseIds.has(exercise.id)).toBe(false);
      expect(exercise.name).toMatch(/\S/);
      expect(exercise.muscleGroup).toBe("shoulders");
      expect(EXERCISE_TYPES).toContain(exercise.exerciseType);
      expect(exercise.notes).toBe("");

      seenExerciseIds.add(exercise.id);
    }
  });
});
