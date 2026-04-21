import { describe, expect, it } from "vitest";

import type { WorkoutExercise } from "../types";
import {
  STANDARD_BARBELL_WEIGHT,
  canUsePlateCalculator,
  formatWeight,
  getNearestLoadableWeight,
  getPlateCalculatorTarget,
  getPlateCalculatorTitle,
  getPlateLayout,
} from "./workoutUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type WorkoutSet = WorkoutExercise["sets"][number];

type WorkoutSetOverrides = Partial<
  Pick<WorkoutSet, "id" | "weight" | "reps" | "completed" | "skipped">
>;

/** Creates a workout set with sensible defaults for test scenarios. */
function createWorkoutSet(overrides: WorkoutSetOverrides = {}): WorkoutSet {
  return {
    id: overrides.id ?? "set-1",
    weight: overrides.weight ?? 0,
    reps: overrides.reps ?? 0,
    completed: overrides.completed ?? false,
    skipped: overrides.skipped ?? false,
  };
}

/** Creates a workout exercise from a provided set list. */
function createWorkoutExercise(sets: WorkoutSet[]): WorkoutExercise {
  return { id: "we-1", exerciseId: "ex-1", sets };
}

// ---------------------------------------------------------------------------
// formatWeight
// ---------------------------------------------------------------------------

describe("formatWeight", () => {
  it("formats integers without decimals", () => {
    expect(formatWeight(45)).toBe("45");
    expect(formatWeight(100)).toBe("100");
  });

  it("formats one decimal place when needed", () => {
    expect(formatWeight(2.5)).toBe("2.5");
    expect(formatWeight(47.5)).toBe("47.5");
  });

  it("rounds to one decimal and drops trailing zero", () => {
    // 10.05 rounds to 10.1 → has decimal
    expect(formatWeight(10.05)).toBe("10.1");
    // 10.00 → integer
    expect(formatWeight(10.0)).toBe("10");
  });

  it("handles zero", () => {
    expect(formatWeight(0)).toBe("0");
  });
});

// ---------------------------------------------------------------------------
// getNearestLoadableWeight
// ---------------------------------------------------------------------------

describe("getNearestLoadableWeight", () => {
  it("returns STANDARD_BARBELL_WEIGHT for weights at or below bar", () => {
    expect(getNearestLoadableWeight(0)).toBe(STANDARD_BARBELL_WEIGHT);
    expect(getNearestLoadableWeight(45)).toBe(STANDARD_BARBELL_WEIGHT);
    expect(getNearestLoadableWeight(30)).toBe(STANDARD_BARBELL_WEIGHT);
  });

  it("snaps to next multiple of 5 above bar weight", () => {
    // 47 → offset = 2 → rounds to 0 → 45 + 0 = 45
    expect(getNearestLoadableWeight(47)).toBe(45);
    // 48 → offset = 3 → rounds to 5 → 45 + 5 = 50
    expect(getNearestLoadableWeight(48)).toBe(50);
    // 50 → offset = 5 → stays 50
    expect(getNearestLoadableWeight(50)).toBe(50);
    // 95 → offset = 50 → already multiple of 5 → 45 + 50 = 95
    expect(getNearestLoadableWeight(95)).toBe(95);
    // 97 → offset = 52 → rounds to 50 → 45 + 50 = 95
    expect(getNearestLoadableWeight(97)).toBe(95);
    // 98 → offset = 53 → rounds to 55 → 45 + 55 = 100
    expect(getNearestLoadableWeight(98)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// getPlateLayout
// ---------------------------------------------------------------------------

describe("getPlateLayout", () => {
  it("returns null for non-positive or non-finite weights", () => {
    expect(getPlateLayout(0)).toBeNull();
    expect(getPlateLayout(-10)).toBeNull();
    expect(getPlateLayout(NaN)).toBeNull();
    expect(getPlateLayout(Infinity)).toBeNull();
  });

  it("returns below-bar status for weights less than bar weight", () => {
    const layout = getPlateLayout(30);
    expect(layout?.status).toBe("below-bar");
    expect(layout?.nearestLoadableWeight).toBe(STANDARD_BARBELL_WEIGHT);
    expect(layout?.perSideWeight).toBe(0);
    expect(layout?.plates).toHaveLength(0);
  });

  it("returns bar-only status for exactly the bar weight", () => {
    const layout = getPlateLayout(STANDARD_BARBELL_WEIGHT);
    expect(layout?.status).toBe("bar-only");
    expect(layout?.nearestLoadableWeight).toBe(STANDARD_BARBELL_WEIGHT);
    expect(layout?.perSideWeight).toBe(0);
    expect(layout?.plates).toHaveLength(0);
  });

  it("returns unloadable status for weights that cannot be loaded with standard plates", () => {
    // 47 lbs → plateWeight = 2 → not a multiple of 5 → unloadable
    const layout = getPlateLayout(47);
    expect(layout?.status).toBe("unloadable");
    expect(layout?.plates).toHaveLength(0);
    expect(layout?.nearestLoadableWeight).toBe(45); // snapped down to bar
  });

  it("returns loadable layout with correct plates for 135 lbs (2x45)", () => {
    // 135 - 45 = 90 plate weight, 45 per side → one 45lb plate per side
    const layout = getPlateLayout(135);
    expect(layout?.status).toBe("loadable");
    expect(layout?.nearestLoadableWeight).toBe(135);
    expect(layout?.perSideWeight).toBe(45);
    expect(layout?.plates).toHaveLength(1);
    expect(layout?.plates[0].weight).toBe(45);
  });

  it("returns loadable layout for 225 lbs (4x45)", () => {
    // 225 - 45 = 180 → 90 per side → two 45lb plates per side
    const layout = getPlateLayout(225);
    expect(layout?.status).toBe("loadable");
    expect(layout?.plates).toHaveLength(2);
    expect(layout?.plates.every((p) => p.weight === 45)).toBe(true);
  });

  it("returns loadable layout with mixed plates for 95 lbs (1x45 + 2x2.5)", () => {
    // 95 - 45 = 50 → 25 per side → one 25lb plate per side
    const layout = getPlateLayout(95);
    expect(layout?.status).toBe("loadable");
    expect(layout?.plates).toHaveLength(1);
    expect(layout?.plates[0].weight).toBe(25);
  });

  it("handles 50 lbs (bar + 2x2.5)", () => {
    // 50 - 45 = 5 → 2.5 per side → one 2.5lb plate per side
    const layout = getPlateLayout(50);
    expect(layout?.status).toBe("loadable");
    expect(layout?.plates).toHaveLength(1);
    expect(layout?.plates[0].weight).toBe(2.5);
  });

  it("computes correct per-side weight", () => {
    const layout = getPlateLayout(185);
    // 185 - 45 = 140 → 70 per side
    expect(layout?.perSideWeight).toBe(70);
  });
});

// ---------------------------------------------------------------------------
// getPlateCalculatorTarget
// ---------------------------------------------------------------------------

describe("getPlateCalculatorTarget", () => {
  it("returns null for an exercise with no sets", () => {
    const exercise = createWorkoutExercise([]);
    expect(getPlateCalculatorTarget(exercise)).toBeNull();
  });

  it("returns the preferred set by ID when provided and found", () => {
    const sets = [
      createWorkoutSet({ id: "s1", completed: true }),
      createWorkoutSet({ id: "s2", weight: 100 }),
      createWorkoutSet({ id: "s3" }),
    ];
    const exercise = createWorkoutExercise(sets);
    const target = getPlateCalculatorTarget(exercise, "s2");
    expect(target?.set.id).toBe("s2");
    expect(target?.setIndex).toBe(1);
  });

  it("falls through to active-set when preferred ID is not found", () => {
    const sets = [
      createWorkoutSet({ id: "s1", completed: true }),
      createWorkoutSet({ id: "s2" }), // first active set
      createWorkoutSet({ id: "s3" }),
    ];
    const exercise = createWorkoutExercise(sets);
    const target = getPlateCalculatorTarget(exercise, "missing-id");
    expect(target?.set.id).toBe("s2");
  });

  it("returns the first active (incomplete, non-skipped) set when no preferred ID", () => {
    const sets = [
      createWorkoutSet({ id: "s1", completed: true }),
      createWorkoutSet({ id: "s2", skipped: true }),
      createWorkoutSet({ id: "s3" }), // first active
    ];
    const exercise = createWorkoutExercise(sets);
    const target = getPlateCalculatorTarget(exercise);
    expect(target?.set.id).toBe("s3");
    expect(target?.setIndex).toBe(2);
  });

  it("falls back to first set with weight when all sets are done", () => {
    const sets = [
      createWorkoutSet({ id: "s1", completed: true, weight: 0 }),
      createWorkoutSet({ id: "s2", skipped: true, weight: 135 }),
      createWorkoutSet({ id: "s3", completed: true, weight: 100 }),
    ];
    const exercise = createWorkoutExercise(sets);
    const target = getPlateCalculatorTarget(exercise);
    // s2 is skipped (not active), s3 is completed. First with weight > 0 is s2
    expect(target?.set.id).toBe("s2");
  });

  it("falls back to set[0] when no sets have weight and all are done", () => {
    const sets = [
      createWorkoutSet({ id: "s1", completed: true, weight: 0 }),
      createWorkoutSet({ id: "s2", completed: true, weight: 0 }),
    ];
    const exercise = createWorkoutExercise(sets);
    const target = getPlateCalculatorTarget(exercise);
    expect(target?.set.id).toBe("s1");
    expect(target?.setIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// canUsePlateCalculator
// ---------------------------------------------------------------------------

describe("canUsePlateCalculator", () => {
  it.each([
    ["barbell", true],
    ["machine", true],
    ["smith-machine", true],
    ["dumbbell", false],
    ["cable", false],
    ["bodyweight", false],
    ["loaded-bodyweight", false],
  ] as const)("returns %s for %s", (equipmentType, expected) => {
    expect(canUsePlateCalculator(equipmentType)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// getPlateCalculatorTitle
// ---------------------------------------------------------------------------

describe("getPlateCalculatorTitle", () => {
  it.each([
    ["machine", "Machine plate estimate (45 lb baseline)"],
    ["smith-machine", "Smith machine plate estimate (45 lb baseline)"],
    ["barbell", "Standard 45 lb barbell"],
    ["dumbbell", "Standard 45 lb barbell"],
    ["cable", "Standard 45 lb barbell"],
  ] as const)("returns the correct title for %s", (equipmentType, expectedTitle) => {
    expect(getPlateCalculatorTitle(equipmentType)).toBe(expectedTitle);
  });
});
