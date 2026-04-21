import type { Exercise } from "../../types";

/** Shared literal values for default chest exercises. */
const chestExerciseDefaults: Pick<Exercise, "muscleGroup" | "notes"> = {
  muscleGroup: "chest",
  notes: "",
};

/**
 * Default chest exercises provided by the application.
 * Includes various chest exercises using different equipment types:
 * barbell, dumbbell, machine, cable, and bodyweight.
 *
 * @remarks
 * - All IDs prefixed with "default-" to mark as read-only
 * - Covers multiple variations (flat, incline, decline)
 * - Different grip widths for compound movements
 * - Mix of compound and isolation exercises
 */
export const chestExercises: Exercise[] = [
  {
    id: "default-bench-press-decline-barbell",
    name: "Bench Press (Decline)",
    exerciseType: "barbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-bench-press-incline-medium-grip",
    name: "Bench Press (Incline, Medium Grip)",
    exerciseType: "barbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-bench-press-incline-narrow-grip",
    name: "Bench Press (Incline, Narrow Grip)",
    exerciseType: "barbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-bench-press-incline-wide-grip",
    name: "Bench Press (Incline, Wide Grip)",
    exerciseType: "barbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-bench-press-medium-grip",
    name: "Bench Press (Medium Grip)",
    exerciseType: "barbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-bench-press-narrow-grip",
    name: "Bench Press (Narrow Grip)",
    exerciseType: "barbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-bench-press-wide-grip",
    name: "Bench Press (Wide Grip)",
    exerciseType: "barbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-cable-chest-press",
    name: "Cable Chest Press",
    exerciseType: "cable",
    ...chestExerciseDefaults,
  },
  {
    id: "default-cable-flye",
    name: "Cable Flye",
    exerciseType: "cable",
    ...chestExerciseDefaults,
  },
  {
    id: "default-cable-flye-bent-over",
    name: "Cable Flye (Bent Over)",
    exerciseType: "cable",
    ...chestExerciseDefaults,
  },
  {
    id: "default-cable-flye-high",
    name: "Cable Flye (High)",
    exerciseType: "cable",
    ...chestExerciseDefaults,
  },
  {
    id: "default-cable-flye-seated",
    name: "Cable Flye (Seated)",
    exerciseType: "cable",
    ...chestExerciseDefaults,
  },
  {
    id: "default-cable-flye-underhand",
    name: "Cable Flye (Underhand)",
    exerciseType: "cable",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dip-chest-focused",
    name: "Dip (Chest-Focused)",
    exerciseType: "bodyweight",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dip-weighted-chest-focused",
    name: "Dip (Weighted, Chest-Focused)",
    exerciseType: "loaded-bodyweight",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dumbbell-flye-flat",
    name: "Dumbbell Flye (Flat)",
    exerciseType: "dumbbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dumbbell-flye-incline",
    name: "Dumbbell Flye (Incline)",
    exerciseType: "dumbbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dumbbell-press-flat",
    name: "Dumbbell Press (Flat)",
    exerciseType: "dumbbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dumbbell-press-incline",
    name: "Dumbbell Press (Incline)",
    exerciseType: "dumbbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dumbbell-press-low-incline",
    name: "Dumbbell Press (Low Incline)",
    exerciseType: "dumbbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dumbbell-press-flye-flat",
    name: "Dumbbell Press Flye (Flat)",
    exerciseType: "dumbbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-dumbbell-press-flye-incline",
    name: "Dumbbell Press Flye (Incline)",
    exerciseType: "dumbbell",
    ...chestExerciseDefaults,
  },
  {
    id: "default-hammer-machine-chest-press-flat",
    name: "Hammer Machine Chest Press (Flat)",
    exerciseType: "machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-hammer-machine-chest-press-incline",
    name: "Hammer Machine Chest Press (Incline)",
    exerciseType: "machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-machine-chest-press",
    name: "Machine Chest Press",
    exerciseType: "machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-machine-chest-press-incline",
    name: "Machine Chest Press (Incline)",
    exerciseType: "machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-machine-flye",
    name: "Machine Flye",
    exerciseType: "machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-pec-dec-flye",
    name: "Pec Dec Flye",
    exerciseType: "machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-pushup",
    name: "Pushup",
    exerciseType: "bodyweight",
    ...chestExerciseDefaults,
  },
  {
    id: "default-pushup-deficit",
    name: "Pushup Deficit",
    exerciseType: "bodyweight",
    ...chestExerciseDefaults,
  },
  {
    id: "default-pushup-narrow-grip",
    name: "Pushup Deficit (Narrow Grip)",
    exerciseType: "bodyweight",
    ...chestExerciseDefaults,
  },
  {
    id: "default-smith-machine-bench-press-medium-grip",
    name: "Smith Machine Bench Press (Medium Grip)",
    exerciseType: "smith-machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-smith-machine-bench-press-narrow-grip",
    name: "Smith Machine Bench Press (Narrow Grip)",
    exerciseType: "smith-machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-smith-machine-bench-press-wide-grip",
    name: "Smith Machine Bench Press (Wide Grip)",
    exerciseType: "smith-machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-smith-machine-press-incline-medium-grip",
    name: "Smith Machine Press (Incline, Medium Grip)",
    exerciseType: "smith-machine",
    ...chestExerciseDefaults,
  },
  {
    id: "default-smith-machine-press-incline-wide-grip",
    name: "Smith Machine Press (Incline, Wide Grip)",
    exerciseType: "smith-machine",
    ...chestExerciseDefaults,
  },
];
