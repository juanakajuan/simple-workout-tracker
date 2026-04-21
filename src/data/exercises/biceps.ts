import type { Exercise } from "../../types";

type ExerciseType = Exercise["exerciseType"];

/**
 * Creates a biceps exercise entry with the shared default fields.
 *
 * @param id Stable exercise identifier.
 * @param name Display name shown in the application.
 * @param exerciseType Equipment or movement classification.
 * @returns A biceps exercise entry.
 */
function createBicepsExercise(
  id: string,
  name: string,
  exerciseType: ExerciseType,
): Exercise {
  return {
    id,
    name,
    muscleGroup: "biceps",
    exerciseType,
    notes: "",
  };
}

/**
 * Default biceps exercises provided by the application.
 * Includes various curling movements and variations.
 */
export const bicepsExercises: Exercise[] = [
  createBicepsExercise(
    "default-barbell-curl-narrow-grip",
    "Barbell Curl (Narrow Grip)",
    "barbell",
  ),
  createBicepsExercise(
    "default-barbell-curl-normal-grip",
    "Barbell Curl (Normal Grip)",
    "barbell",
  ),
  createBicepsExercise("default-bayesian-curl", "Bayesian Curl", "cable"),
  createBicepsExercise("default-cable-curl", "Cable Curl", "cable"),
  createBicepsExercise("default-cable-curl-ez-bar", "Cable Curl (EZ Bar)", "cable"),
  createBicepsExercise(
    "default-cable-curl-ez-bar-wide-grip",
    "Cable Curl (EZ Bar, Wide Grip)",
    "cable",
  ),
  createBicepsExercise(
    "default-cable-curl-single-arm",
    "Cable Curl (Single-Arm)",
    "cable",
  ),
  createBicepsExercise("default-cable-hammer-curl", "Cable Hammer Curl", "cable"),
  createBicepsExercise(
    "default-cable-rope-twist-curl",
    "Cable Rope Twist Curl",
    "cable",
  ),
  createBicepsExercise("default-concentration-curl", "Concentration Curl", "dumbbell"),
  createBicepsExercise("default-dumbbell-curl-2-arm", "Dumbbell Curl (2-Arm)", "dumbbell"),
  createBicepsExercise(
    "default-dumbbell-curl-alternating",
    "Dumbbell Curl (Alternating)",
    "dumbbell",
  ),
  createBicepsExercise(
    "default-dumbbell-curl-incline",
    "Dumbbell Curl (Incline)",
    "dumbbell",
  ),
  createBicepsExercise(
    "default-dumbbell-preacher-curl-single-arm",
    "Dumbbell Preacher Curl (Single-Arm)",
    "dumbbell",
  ),
  createBicepsExercise("default-dumbbell-spider-curl", "Dumbbell Spider Curl", "dumbbell"),
  createBicepsExercise("default-dumbbell-twist-curl", "Dumbbell Twist Curl", "dumbbell"),
  createBicepsExercise("default-ez-bar-curl-narrow-grip", "EZ Bar Curl (Narrow Grip)", "barbell"),
  createBicepsExercise("default-ez-bar-curl-normal-grip", "EZ Bar Curl (Normal Grip)", "barbell"),
  createBicepsExercise("default-ez-bar-curl-wide-grip", "EZ Bar Curl (Wide Grip)", "barbell"),
  createBicepsExercise("default-ez-bar-preacher-curl", "EZ Bar Preacher Curl", "barbell"),
  createBicepsExercise("default-ez-bar-spider-curl", "EZ Bar Spider Curl", "barbell"),
  createBicepsExercise(
    "default-freemotion-curl-facing-away",
    "Freemotion Curl (Facing Away)",
    "freemotion",
  ),
  createBicepsExercise(
    "default-freemotion-curl-facing-machine",
    "Freemotion Curl (Facing Machine)",
    "freemotion",
  ),
  createBicepsExercise(
    "default-freemotion-curl-single-arm",
    "Freemotion Curl (Single-Arm)",
    "freemotion",
  ),
  createBicepsExercise("default-hammer-curl", "Hammer Curl", "dumbbell"),
  createBicepsExercise("default-hammer-preacher-curl", "Hammer Preacher Curl", "dumbbell"),
  createBicepsExercise(
    "default-lying-biceps-dumbbell-curl",
    "Lying Biceps Dumbbell Curl",
    "dumbbell",
  ),
  createBicepsExercise("default-lying-cable-curl", "Lying Cable Curl", "cable"),
  createBicepsExercise("default-lying-down-curl", "Lying Down Curl", "cable"),
  createBicepsExercise("default-lying-dumbbell-curl", "Lying Dumbbell Curl", "dumbbell"),
  createBicepsExercise("default-machine-preacher-curl", "Machine Preacher Curl", "machine"),
];
