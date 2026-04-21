import type { Exercise } from "../../types";

type ExerciseType = Exercise["exerciseType"];

/**
 * Creates a triceps exercise entry with the shared default fields.
 *
 * @param id Stable exercise identifier.
 * @param name Display name shown in the application.
 * @param exerciseType Equipment or movement classification.
 * @returns A triceps exercise entry.
 */
function createTricepsExercise(
  id: string,
  name: string,
  exerciseType: ExerciseType,
): Exercise {
  return {
    id,
    name,
    muscleGroup: "triceps",
    exerciseType,
    notes: "",
  };
}

/**
 * Default triceps exercises provided by the application.
 * Includes extensions, presses, and dip variations.
 */
export const tricepsExercises: Exercise[] = [
  createTricepsExercise("default-assisted-dip", "Assisted Dip", "machine-assistance"),
  createTricepsExercise(
    "default-barbell-overhead-triceps-extension",
    "Barbell Overhead Triceps Extension",
    "barbell",
  ),
  createTricepsExercise(
    "default-barbell-overhead-triceps-extension-seated",
    "Barbell Overhead Triceps Extension (Seated)",
    "barbell",
  ),
  createTricepsExercise("default-barbell-skullcrusher", "Barbell Skullcrusher", "barbell"),
  createTricepsExercise("default-bench-press-close-grip", "Bench Press (Close Grip)", "barbell"),
  createTricepsExercise(
    "default-cable-overhead-triceps-extension",
    "Cable Overhead Triceps Extension",
    "cable",
  ),
  createTricepsExercise(
    "default-cable-overhead-triceps-extension-rope",
    "Cable Overhead Triceps Extension (Rope)",
    "cable",
  ),
  createTricepsExercise("default-cable-tricep-kickback", "Cable Tricep Kickback", "cable"),
  createTricepsExercise(
    "default-cable-triceps-pushdown-bar",
    "Cable Triceps Pushdown (Bar)",
    "cable",
  ),
  createTricepsExercise(
    "default-cable-triceps-pushdown-rope",
    "Cable Triceps Pushdown (Rope)",
    "cable",
  ),
  createTricepsExercise(
    "default-cable-triceps-pushdown-single-arm",
    "Cable Triceps Pushdown (Single-Arm)",
    "cable",
  ),
  createTricepsExercise("default-dips-triceps-focused", "Dips (Triceps-Focused)", "bodyweight"),
  createTricepsExercise("default-dip-machine", "Dip Machine", "machine"),
  createTricepsExercise(
    "default-dumbbell-overhead-extension",
    "Dumbbell Overhead Extension",
    "dumbbell",
  ),
  createTricepsExercise(
    "default-dumbbell-overhead-extension-single-arm",
    "Dumbbell Overhead Extension (Single-Arm)",
    "dumbbell",
  ),
  createTricepsExercise("default-dumbbell-skullcrusher", "Dumbbell Skullcrusher", "dumbbell"),
  createTricepsExercise(
    "default-ez-bar-overhead-triceps-extension",
    "EZ Bar Overhead Triceps Extension",
    "barbell",
  ),
  createTricepsExercise(
    "default-ez-bar-overhead-triceps-extension-seated",
    "EZ Bar Overhead Triceps Extension (Seated)",
    "barbell",
  ),
  createTricepsExercise("default-ez-bar-skullcrusher", "EZ Bar Skullcrusher", "barbell"),
  createTricepsExercise("default-inverted-skullcrusher", "Inverted Skullcrusher", "bodyweight"),
  createTricepsExercise("default-jm-press", "JM Press", "barbell"),
  createTricepsExercise(
    "default-machine-triceps-extension",
    "Machine Triceps Extension",
    "machine",
  ),
  createTricepsExercise(
    "default-machine-triceps-pushdown",
    "Machine Triceps Pushdown",
    "machine",
  ),
  createTricepsExercise("default-smith-machine-jm-press", "Smith Machine JM Press", "smith-machine"),
  createTricepsExercise(
    "default-smith-machine-skullcrusher",
    "Smith Machine Skullcrusher",
    "smith-machine",
  ),
];
