import type { Exercise } from "../../types";

const shouldersMuscleGroup: Exercise["muscleGroup"] = "shoulders";
const defaultNotes: Exercise["notes"] = "";

/**
 * Creates a shoulder exercise entry while keeping shared defaults in one place.
 *
 * @param id - Stable default exercise identifier.
 * @param name - Display name shown in the exercise library.
 * @param exerciseType - Equipment category for the exercise.
 * @returns Fully populated shoulder exercise data.
 */
function createShouldersExercise(
  id: Exercise["id"],
  name: Exercise["name"],
  exerciseType: Exercise["exerciseType"],
): Exercise {
  return {
    id,
    name,
    muscleGroup: shouldersMuscleGroup,
    exerciseType,
    notes: defaultNotes,
  };
}

/**
 * Default shoulder exercises provided by the application.
 * Covers front, side, and rear deltoid movements.
 */
export const shouldersExercises: Exercise[] = [
  createShouldersExercise("default-arnold-press", "Arnold Press", "dumbbell"),
  createShouldersExercise("default-barbell-bent-over-shrug", "Barbell Bent Over Shrug", "barbell"),
  createShouldersExercise("default-barbell-facepull", "Barbell Facepull", "barbell"),
  createShouldersExercise("default-barbell-front-raise", "Barbell Front Raise", "barbell"),
  createShouldersExercise(
    "default-barbell-front-raise-ez-bar-underhand",
    "Barbell Front Raise (EZ Bar, Underhand)",
    "barbell",
  ),
  createShouldersExercise("default-barbell-shoulder-press-seated", "Barbell Shoulder Press (Seated)", "barbell"),
  createShouldersExercise("default-barbell-shoulder-press-standing", "Barbell Shoulder Press (Standing)", "barbell"),
  createShouldersExercise("default-barbell-shrug", "Barbell Shrug", "barbell"),
  createShouldersExercise("default-barbell-upright-row", "Barbell Upright Row", "barbell"),
  createShouldersExercise("default-cable-bent-over-shrug", "Cable Bent Over Shrug", "cable"),
  createShouldersExercise(
    "default-cable-cross-body-bent-lateral-raise",
    "Cable Cross Body Bent Lateral Raise",
    "cable",
  ),
  createShouldersExercise("default-cable-cross-body-lateral-raise", "Cable Cross Body Lateral Raise", "cable"),
  createShouldersExercise("default-cable-front-raise-underhand", "Cable Front Raise (Underhand)", "cable"),
  createShouldersExercise("default-cable-lateral-raise", "Cable Lateral Raise", "cable"),
  createShouldersExercise("default-cable-lateral-raise-single-arm", "Cable Lateral Raise (Single-Arm)", "cable"),
  createShouldersExercise("default-cable-leaning-lateral-raise", "Cable Leaning Lateral Raise", "cable"),
  createShouldersExercise("default-cable-rope-facepull", "Cable Rope Facepull", "cable"),
  createShouldersExercise("default-cable-rope-facepull-kneeling", "Cable Rope Facepull (Kneeling)", "cable"),
  createShouldersExercise("default-cable-shrug", "Cable Shrug", "cable"),
  createShouldersExercise("default-cable-side-shrug", "Cable Side Shrug", "cable"),
  createShouldersExercise("default-cable-single-arm-rear-delt-raise", "Cable Single Arm Rear Delt Raise", "cable"),
  createShouldersExercise("default-cable-single-arm-side-shrug", "Cable Single Arm Side Shrug", "cable"),
  createShouldersExercise("default-cable-upright-row", "Cable Upright Row", "cable"),
  createShouldersExercise("default-dumbbell-bent-lateral-raise", "Dumbbell Bent Lateral Raise", "dumbbell"),
  createShouldersExercise("default-dumbbell-bent-over-shrug", "Dumbbell Bent Over Shrug", "dumbbell"),
  createShouldersExercise("default-dumbbell-facepull", "Dumbbell Facepull", "dumbbell"),
  createShouldersExercise("default-dumbbell-facepull-incline", "Dumbbell Facepull (Incline)", "dumbbell"),
  createShouldersExercise("default-dumbbell-front-raise", "Dumbbell Front Raise", "dumbbell"),
  createShouldersExercise("default-dumbbell-lateral-raise", "Dumbbell Lateral Raise", "dumbbell"),
  createShouldersExercise("default-dumbbell-lateral-raise-incline", "Dumbbell Lateral Raise (Incline)", "dumbbell"),
  createShouldersExercise("default-dumbbell-lateral-raise-super-rom", "Dumbbell Lateral Raise (Super ROM)", "dumbbell"),
  createShouldersExercise("default-dumbbell-lateral-raise-thumbs-down", "Dumbbell Lateral Raise (Thumbs Down)", "dumbbell"),
  createShouldersExercise("default-dumbbell-lateral-raise-top-hold", "Dumbbell Lateral Raise (Top Hold)", "dumbbell"),
  createShouldersExercise("default-dumbbell-leaning-shrug", "Dumbbell Leaning Shrug", "dumbbell"),
  createShouldersExercise("default-dumbbell-press-high-incline", "Dumbbell Press (High Incline)", "dumbbell"),
  createShouldersExercise("default-dumbbell-shoulder-press-seated", "Dumbbell Shoulder Press (Seated)", "dumbbell"),
  createShouldersExercise("default-dumbbell-shoulder-press-standing", "Dumbbell Shoulder Press (Standing)", "dumbbell"),
  createShouldersExercise("default-dumbbell-shrug", "Dumbbell Shrug", "dumbbell"),
  createShouldersExercise("default-dumbbell-shrug-seated", "Dumbbell Shrug (Seated)", "dumbbell"),
  createShouldersExercise("default-dumbbell-upright-row", "Dumbbell Upright Row", "dumbbell"),
  createShouldersExercise("default-freemotion-rear-delt-flyes", "Freemotion Rear Delt Flyes", "freemotion"),
  createShouldersExercise("default-freemotion-rear-delt-flyes-paused", "Freemotion Rear Delt Flyes (Paused)", "freemotion"),
  createShouldersExercise("default-freemotion-y-raises", "Freemotion Y-Raises", "freemotion"),
  createShouldersExercise("default-freemotion-y-raises-paused", "Freemotion Y-Raises (Paused)", "freemotion"),
  createShouldersExercise("default-machine-lateral-raise", "Machine Lateral Raise", "machine"),
  createShouldersExercise("default-machine-reverse-flye", "Machine Reverse Flye", "machine"),
  createShouldersExercise("default-machine-shoulder-press", "Machine Shoulder Press", "machine"),
  createShouldersExercise("default-one-arm-leaning-lateral-raise", "One-Arm Leaning Lateral Raise", "dumbbell"),
  createShouldersExercise(
    "default-smith-machine-shoulder-press-seated",
    "Smith Machine Shoulder Press (Seated)",
    "smith-machine",
  ),
  createShouldersExercise("default-smith-machine-upright-row", "Smith Machine Upright Row", "smith-machine"),
];
