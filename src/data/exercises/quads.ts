import type { Exercise } from "../../types";

type ExerciseType = Exercise["exerciseType"];

/**
 * Creates a quadriceps exercise entry with the shared default fields.
 *
 * @param id Stable exercise identifier.
 * @param name Display name shown in the application.
 * @param exerciseType Equipment or movement classification.
 * @returns A quadriceps exercise entry.
 */
function createQuadricepsExercise(
  id: string,
  name: string,
  exerciseType: ExerciseType,
): Exercise {
  return {
    id,
    name,
    muscleGroup: "quads",
    exerciseType,
    notes: "",
  };
}

/**
 * Default quadriceps exercises provided by the application.
 * Includes squats, lunges, leg presses, and isolation movements.
 */
export const quadsExercises: Exercise[] = [
  createQuadricepsExercise("default-barbell-split-squat", "Barbell Split Squat", "barbell"),
  createQuadricepsExercise(
    "default-barbell-squat-cambered-bar",
    "Barbell Squat (Cambered Bar)",
    "barbell",
  ),
  createQuadricepsExercise(
    "default-barbell-squat-close-stance-feet-forward",
    "Barbell Squat (Close Stance, Feet Forward)",
    "barbell",
  ),
  createQuadricepsExercise("default-barbell-squat-high-bar", "Barbell Squat (High Bar)", "barbell"),
  createQuadricepsExercise(
    "default-barbell-squat-narrow-stance",
    "Barbell Squat (Narrow Stance)",
    "barbell",
  ),
  createQuadricepsExercise(
    "default-barbell-squat-safety-bar",
    "Barbell Squat (Safety Bar)",
    "barbell",
  ),
  createQuadricepsExercise("default-belt-squat", "Belt Squat", "machine"),
  createQuadricepsExercise("default-bodyweight-squat", "Bodyweight Squat", "bodyweight"),
  createQuadricepsExercise(
    "default-bulgarian-split-squat-quad-focused",
    "Bulgarian Split Squat (Quad-Focused)",
    "dumbbell",
  ),
  createQuadricepsExercise("default-dumbbell-front-squat", "Dumbbell Front Squat", "dumbbell"),
  createQuadricepsExercise("default-front-squat", "Front Squat", "barbell"),
  createQuadricepsExercise("default-front-squat-cross-grip", "Front Squat (Cross Grip)", "barbell"),
  createQuadricepsExercise("default-goblet-squat", "Goblet Squat", "dumbbell"),
  createQuadricepsExercise("default-hack-squat", "Hack Squat", "machine"),
  createQuadricepsExercise("default-hip-adduction", "Hip Adduction", "machine"),
  createQuadricepsExercise("default-leg-extension", "Leg Extension", "machine"),
  createQuadricepsExercise("default-leg-press", "Leg Press", "machine"),
  createQuadricepsExercise("default-pendulum-squat", "Pendulum Squat", "machine"),
  createQuadricepsExercise("default-single-leg-extension", "Single Leg Extension", "machine"),
  createQuadricepsExercise("default-single-leg-press", "Single Leg Press", "machine"),
  createQuadricepsExercise("default-sissy-squat-machine", "Sissy Squat (Machine)", "bodyweight"),
  createQuadricepsExercise("default-sissy-squat-no-machine", "Sissy Squat (No Machine)", "bodyweight"),
  createQuadricepsExercise(
    "default-smith-machine-squat-feet-forward",
    "Smith Machine Squat (Feet Forward)",
    "smith-machine",
  ),
  createQuadricepsExercise(
    "default-walking-lunges-quad-focused-barbell",
    "Walking Lunges (Quad-Focused, Barbell)",
    "barbell",
  ),
  createQuadricepsExercise(
    "default-walking-lunges-quad-focused-bodyweight",
    "Walking Lunges (Quad-Focused, Bodyweight)",
    "bodyweight",
  ),
  createQuadricepsExercise(
    "default-walking-lunges-quad-focused-dumbbell",
    "Walking Lunges (Quad-Focused, Dumbbell)",
    "dumbbell",
  ),
];
