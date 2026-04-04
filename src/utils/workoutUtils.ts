import type { Exercise, WorkoutExercise, WorkoutSet } from "../types";

/**
 * Weight of a standard Olympic barbell in pounds.
 * Used as the baseline for plate calculations.
 */
export const STANDARD_BARBELL_WEIGHT = 45;

/**
 * Set of exercise types that support plate calculator functionality.
 * These exercise types use plates that can be calculated and visualized.
 */
export const PLATE_CALCULATOR_EXERCISE_TYPES = new Set<Exercise["exerciseType"]>([
  "barbell",
  "machine",
  "smith-machine",
]);

/**
 * Standard Olympic weight plates with their visual properties.
 * Used for plate visualization and calculation.
 * Each plate includes weight, dimensions for rendering, and CSS class for styling.
 */
export const STANDARD_PLATES = [
  { weight: 45, width: 36, height: 96, className: "plate-blue" },
  { weight: 35, width: 38, height: 90, className: "plate-indigo" },
  { weight: 25, width: 32, height: 82, className: "plate-slate" },
  { weight: 10, width: 24, height: 70, className: "plate-dark" },
  { weight: 5, width: 18, height: 60, className: "plate-dark" },
  { weight: 2.5, width: 14, height: 54, className: "plate-outline" },
] as const;

/**
 * Represents the calculated plate layout for a given weight.
 * Provides information about whether the weight can be loaded on the bar,
 * the nearest achievable weight, and the specific plates needed per side.
 */
export interface PlateLayout {
  /** Status indicating if/how the weight can be loaded on the bar */
  status: "bar-only" | "loadable" | "below-bar" | "unloadable";
  /** The nearest weight that can be loaded with available plates */
  nearestLoadableWeight: number;
  /** Weight per side of the barbell (after subtracting bar weight) */
  perSideWeight: number;
  /** Array of plates to load on each side of the bar */
  plates: (typeof STANDARD_PLATES)[number][];
}

/**
 * Target information for the plate calculator.
 * Identifies which set to use for plate calculations within a workout exercise.
 */
export interface PlateCalculatorTarget {
  /** The workout set selected for plate calculation */
  set: WorkoutSet;
  /** Zero-based index of the set within the workout exercise */
  setIndex: number;
}

/**
 * Formats a weight value for display.
 * Rounds to one decimal place and removes trailing zeros for whole numbers.
 *
 * @param weight - The weight value to format
 * @returns Formatted weight string (e.g., "135" for 135.0, "67.5" for 67.5)
 *
 * @example
 * formatWeight(135) // Returns "135"
 * formatWeight(67.5) // Returns "67.5"
 * formatWeight(67.55) // Returns "67.6" (rounded)
 */
export function formatWeight(weight: number): string {
  const roundedWeight = Math.round(weight * 10) / 10;
  return Number.isInteger(roundedWeight) ? `${roundedWeight}` : roundedWeight.toFixed(1);
}

/**
 * Calculates the nearest weight that can be loaded with standard plates.
 * Standard plates come in 5 lb increments (after the 45 lb bar), so this
 * rounds to the nearest 5 lb increment above the bar weight.
 *
 * @param totalWeight - The target total weight including bar
 * @returns The nearest achievable weight with standard plates
 *
 * @example
 * getNearestLoadableWeight(45) // Returns 45 (just the bar)
 * getNearestLoadableWeight(137) // Returns 135 (45 + 2*45)
 * getNearestLoadableWeight(138) // Returns 140 (45 + 2*47.5, rounded to 5lb increments)
 */
export function getNearestLoadableWeight(totalWeight: number): number {
  if (totalWeight <= STANDARD_BARBELL_WEIGHT) {
    return STANDARD_BARBELL_WEIGHT;
  }

  const roundedOffset = Math.round((totalWeight - STANDARD_BARBELL_WEIGHT) / 5) * 5;
  return STANDARD_BARBELL_WEIGHT + Math.max(0, roundedOffset);
}

/**
 * Calculates the plate layout needed to achieve a target weight.
 * Determines which plates to load on each side of the bar and whether
 * the weight is achievable with standard plate increments.
 *
 * @param totalWeight - The target total weight including the bar
 * @returns PlateLayout object with status and plate breakdown, or null if invalid input
 *
 * @example
 * getPlateLayout(135) // Returns loadable layout with 45lb plate per side
 * getPlateLayout(45)  // Returns bar-only status (no plates needed)
 * getPlateLayout(30)  // Returns below-bar status (less than bar weight)
 * getPlateLayout(137) // Returns unloadable status (not 5lb increment)
 */
export function getPlateLayout(totalWeight: number): PlateLayout | null {
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) return null;

  if (totalWeight < STANDARD_BARBELL_WEIGHT) {
    return {
      status: "below-bar",
      nearestLoadableWeight: STANDARD_BARBELL_WEIGHT,
      perSideWeight: 0,
      plates: [],
    };
  }

  const plateWeight = totalWeight - STANDARD_BARBELL_WEIGHT;

  if (Math.abs(plateWeight) < 0.001) {
    return {
      status: "bar-only",
      nearestLoadableWeight: STANDARD_BARBELL_WEIGHT,
      perSideWeight: 0,
      plates: [],
    };
  }

  const loadableRemainder = ((plateWeight % 5) + 5) % 5;
  if (loadableRemainder > 0.001 && Math.abs(loadableRemainder - 5) > 0.001) {
    return {
      status: "unloadable",
      nearestLoadableWeight: getNearestLoadableWeight(totalWeight),
      perSideWeight: plateWeight / 2,
      plates: [],
    };
  }

  let remainingPerSideWeight = plateWeight / 2;
  const plates: (typeof STANDARD_PLATES)[number][] = [];

  STANDARD_PLATES.forEach((plate) => {
    while (remainingPerSideWeight + 0.001 >= plate.weight) {
      plates.push(plate);
      remainingPerSideWeight -= plate.weight;
    }
  });

  return {
    status: "loadable",
    nearestLoadableWeight: totalWeight,
    perSideWeight: plateWeight / 2,
    plates,
  };
}

/**
 * Determines the target set for plate calculator operations.
 * Selects a set based on priority: preferred set ID > active (incomplete) set > weighted set > first set.
 *
 * @param workoutExercise - The workout exercise containing sets
 * @param preferredSetId - Optional ID of a preferred set to use
 * @returns PlateCalculatorTarget with the selected set and its index, or null if no sets exist
 *
 * @example
 * // Returns set with matching ID if it exists
 * getPlateCalculatorTarget(exercise, "set-123")
 *
 * // Returns first incomplete set if no preferred ID
 * getPlateCalculatorTarget(exercise)
 */
export function getPlateCalculatorTarget(
  workoutExercise: WorkoutExercise,
  preferredSetId?: string
): PlateCalculatorTarget | null {
  if (preferredSetId) {
    const selectedSetIndex = workoutExercise.sets.findIndex((set) => set.id === preferredSetId);
    if (selectedSetIndex !== -1) {
      return {
        set: workoutExercise.sets[selectedSetIndex],
        setIndex: selectedSetIndex,
      };
    }
  }

  const activeSetIndex = workoutExercise.sets.findIndex((set) => !set.completed && !set.skipped);
  if (activeSetIndex !== -1) {
    return {
      set: workoutExercise.sets[activeSetIndex],
      setIndex: activeSetIndex,
    };
  }

  const weightedSetIndex = workoutExercise.sets.findIndex((set) => set.weight > 0);
  if (weightedSetIndex !== -1) {
    return {
      set: workoutExercise.sets[weightedSetIndex],
      setIndex: weightedSetIndex,
    };
  }

  if (workoutExercise.sets[0]) {
    return {
      set: workoutExercise.sets[0],
      setIndex: 0,
    };
  }

  return null;
}

/**
 * Checks if an exercise type supports plate calculator functionality.
 *
 * @param exerciseType - The type of exercise to check
 * @returns True if the exercise type can use the plate calculator
 *
 * @example
 * canUsePlateCalculator("barbell") // Returns true
 * canUsePlateCalculator("dumbbell")  // Returns false
 */
export function canUsePlateCalculator(exerciseType: Exercise["exerciseType"]): boolean {
  return PLATE_CALCULATOR_EXERCISE_TYPES.has(exerciseType);
}

/**
 * Returns the display title for the plate calculator based on exercise type.
 * Provides context about the bar/machine weight baseline for the calculation.
 *
 * @param exerciseType - The type of exercise
 * @returns A descriptive title string for the plate calculator UI
 *
 * @example
 * getPlateCalculatorTitle("barbell")      // Returns "Standard 45 lb barbell"
 * getPlateCalculatorTitle("machine")      // Returns "Machine plate estimate (45 lb baseline)"
 * getPlateCalculatorTitle("smith-machine") // Returns "Smith machine plate estimate (45 lb baseline)"
 */
export function getPlateCalculatorTitle(exerciseType: Exercise["exerciseType"]): string {
  if (exerciseType === "machine") {
    return "Machine plate estimate (45 lb baseline)";
  }

  if (exerciseType === "smith-machine") {
    return "Smith machine plate estimate (45 lb baseline)";
  }

  return "Standard 45 lb barbell";
}
