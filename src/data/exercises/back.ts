import type { Exercise } from "../../types";

type ExerciseType = Exercise["exerciseType"];

/**
 * Creates a back exercise entry with the shared default fields.
 *
 * @param id Stable exercise identifier.
 * @param name Display name shown in the application.
 * @param exerciseType Equipment or movement classification.
 * @returns A back exercise entry.
 */
function createBackExercise(
  id: string,
  name: string,
  exerciseType: ExerciseType,
): Exercise {
  return {
    id,
    name,
    muscleGroup: "back",
    exerciseType,
    notes: "",
  };
}

/**
 * Default back exercises provided by the application.
 * Includes various back exercises for width and thickness development.
 */
export const backExercises: Exercise[] = [
  createBackExercise(
    "default-assisted-pullup-normal-grip",
    "Assisted Pullup (Normal Grip)",
    "machine-assistance",
  ),
  createBackExercise(
    "default-assisted-pullup-parallel-grip",
    "Assisted Pullup (Parallel Grip)",
    "machine-assistance",
  ),
  createBackExercise(
    "default-assisted-pullup-underhand-grip",
    "Assisted Pullup (Underhand Grip)",
    "machine-assistance",
  ),
  createBackExercise(
    "default-assisted-pullup-wide-grip",
    "Assisted Pullup (Wide Grip)",
    "machine-assistance",
  ),
  createBackExercise("default-back-extension", "Back Extension", "loaded-bodyweight"),
  createBackExercise(
    "default-barbell-bent-over-row",
    "Barbell Bent Over Row",
    "barbell",
  ),
  createBackExercise("default-barbell-flexion-row", "Barbell Flexion Row", "barbell"),
  createBackExercise("default-barbell-row-to-chest", "Barbell Row to Chest", "barbell"),
  createBackExercise("default-cable-flexion-row", "Cable Flexion Row", "cable"),
  createBackExercise("default-cable-pullover", "Cable Pullover", "cable"),
  createBackExercise("default-cambered-bar-row", "Cambered Bar Row", "barbell"),
  createBackExercise("default-chest-supported-row", "Chest Supported Row", "machine"),
  createBackExercise("default-deadlift", "Deadlift", "barbell"),
  createBackExercise("default-dumbbell-pullover", "Dumbbell Pullover", "dumbbell"),
  createBackExercise("default-dumbbell-row-2-arm", "Dumbbell Row (2-Arm)", "dumbbell"),
  createBackExercise(
    "default-dumbbell-row-2-arm-incline",
    "Dumbbell Row (2-Arm, Incline)",
    "dumbbell",
  ),
  createBackExercise(
    "default-dumbbell-row-single-arm-supported",
    "Dumbbell Row (Single-Arm, Supported)",
    "dumbbell",
  ),
  createBackExercise("default-dumbbell-row-to-hips", "Dumbbell Row to Hips", "dumbbell"),
  createBackExercise("default-ez-bar-row-underhand", "EZ Bar Row (Underhand)", "barbell"),
  createBackExercise(
    "default-hammer-machine-row-high",
    "Hammer Machine Row (High)",
    "machine",
  ),
  createBackExercise(
    "default-hammer-machine-row-low",
    "Hammer Machine Row (Low)",
    "machine",
  ),
  createBackExercise("default-inverted-row", "Inverted Row", "bodyweight"),
  createBackExercise("default-landmine-row", "Landmine Row", "barbell"),
  createBackExercise(
    "default-machine-chest-supported-row",
    "Machine Chest Supported Row",
    "machine",
  ),
  createBackExercise("default-machine-pulldown", "Machine Pulldown", "machine"),
  createBackExercise("default-machine-pullover", "Machine Pullover", "machine"),
  createBackExercise("default-meadows-row", "Meadows Row", "barbell"),
  createBackExercise("default-pulldown-narrow-grip", "Pulldown (Narrow Grip)", "cable"),
  createBackExercise("default-pulldown-normal-grip", "Pulldown (Normal Grip)", "cable"),
  createBackExercise(
    "default-pulldown-parallel-grip",
    "Pulldown (Parallel Grip)",
    "cable",
  ),
  createBackExercise("default-pulldown-single-arm", "Pulldown (Single-Arm)", "cable"),
  createBackExercise("default-pulldown-straight-arm", "Pulldown (Straight Arm)", "cable"),
  createBackExercise(
    "default-pulldown-underhand-grip",
    "Pulldown (Underhand Grip)",
    "cable",
  ),
  createBackExercise(
    "default-pulldown-upright-torso-to-abs",
    "Pulldown (Upright Torso to Abs)",
    "cable",
  ),
  createBackExercise("default-pulldown-wide-grip", "Pulldown (Wide Grip)", "cable"),
  createBackExercise("default-pullup-normal-grip", "Pullup (Normal Grip)", "bodyweight"),
  createBackExercise(
    "default-pullup-parallel-grip",
    "Pullup (Parallel Grip)",
    "bodyweight",
  ),
  createBackExercise(
    "default-pullup-underhand-grip",
    "Pullup (Underhand Grip)",
    "bodyweight",
  ),
  createBackExercise(
    "default-pullup-weighted-normal-grip",
    "Pullup (Weighted, Normal Grip)",
    "loaded-bodyweight",
  ),
  createBackExercise(
    "default-pullup-weighted-parallel-grip",
    "Pullup (Weighted, Parallel Grip)",
    "loaded-bodyweight",
  ),
  createBackExercise(
    "default-pullup-weighted-underhand-grip",
    "Pullup (Weighted, Underhand Grip)",
    "loaded-bodyweight",
  ),
  createBackExercise(
    "default-pullup-weighted-wide-grip",
    "Pullup (Weighted, Wide Grip)",
    "loaded-bodyweight",
  ),
  createBackExercise("default-pullup-wide-grip", "Pullup (Wide Grip)", "bodyweight"),
  createBackExercise("default-seal-row", "Seal Row", "barbell"),
  createBackExercise("default-seated-cable-row", "Seated Cable Row", "cable"),
  createBackExercise(
    "default-seated-cable-row-single-arm",
    "Seated Cable Row (Single-Arm)",
    "cable",
  ),
  createBackExercise("default-smith-machine-row", "Smith Machine Row", "smith-machine"),
  createBackExercise("default-t-bar-row", "T-Bar Row", "machine"),
];
