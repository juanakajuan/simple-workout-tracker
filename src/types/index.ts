/**
 * Represents a muscle group that can be targeted by exercises.
 * Used for categorizing and filtering exercises in the workout tracker.
 */
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs"
  | "traps";

/**
 * Represents the type of equipment or method used for an exercise.
 * Used for filtering and organizing exercises by equipment availability.
 */
export type ExerciseType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "machine-assistance"
  | "smith-machine"
  | "cable"
  | "freemotion"
  | "bodyweight"
  | "loaded-bodyweight";

export type IntensityTechnique = "myoreps" | "myorep-match" | "drop-set" | "super-set";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  exerciseType: ExerciseType;
  notes: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  skipped?: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  intensityTechnique?: IntensityTechnique | null;
  supersetGroupId?: string | null;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  startTime: string;
  duration?: number;
  exercises: WorkoutExercise[];
  completed: boolean;
  templateId?: string;
}

export interface TemplateExercise {
  id: string;
  exerciseId: string | null;
  setCount: number;
  intensityTechnique?: IntensityTechnique | null;
  supersetGroupId?: string | null;
}

export interface TemplateMuscleGroup {
  id: string;
  muscleGroup: MuscleGroup;
  exercises: TemplateExercise[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  muscleGroups: TemplateMuscleGroup[];
}

export interface WorkoutTemplateDraft {
  name: string;
  exercises: TemplateExercise[];
}

export interface Settings {
  autoMatchWeight: boolean;
}

/**
 * Array of all available muscle groups in the application.
 * Used for generating UI elements and validation.
 */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "traps",
];

/**
 * Array of all available exercise types in the application.
 * Used for generating UI elements and validation.
 */
export const EXERCISE_TYPES: ExerciseType[] = [
  "barbell",
  "dumbbell",
  "machine",
  "machine-assistance",
  "smith-machine",
  "cable",
  "freemotion",
  "bodyweight",
  "loaded-bodyweight",
];

export const INTENSITY_TECHNIQUES: IntensityTechnique[] = [
  "myoreps",
  "myorep-match",
  "drop-set",
  "super-set",
];

/**
 * Human-readable labels for muscle groups.
 * Maps muscle group keys to display names for UI rendering.
 */
export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  abs: "Abs",
  traps: "Traps",
};

/**
 * Human-readable labels for exercise types.
 * Maps exercise type keys to display names for UI rendering.
 */
export const exerciseTypeLabels: Record<ExerciseType, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  "machine-assistance": "Machine Assistance",
  "smith-machine": "Smith Machine",
  cable: "Cable",
  freemotion: "Freemotion",
  bodyweight: "Bodyweight",
  "loaded-bodyweight": "Loaded Bodyweight",
};

export const intensityTechniqueLabels: Record<IntensityTechnique, string> = {
  myoreps: "Myoreps",
  "myorep-match": "Myorep Match",
  "drop-set": "Drop Set",
  "super-set": "Superset",
};

/**
 * Color codes for muscle groups used in UI tags and visual elements.
 * Organized by training categories:
 * - Upper Push (Pink): Chest, Triceps, Shoulders
 * - Upper Pull (Blue): Back, Biceps
 * - Legs (Green): Quads, Glutes, Hamstrings
 * - Accessory (Purple): Calves, Traps, Forearms, Abs
 */
export const muscleGroupColors: Record<MuscleGroup, string> = {
  // Upper Push - Pink
  chest: "#ec4899",
  triceps: "#ec4899",
  shoulders: "#ec4899",
  // Upper Pull - Blue
  back: "#3b82f6",
  biceps: "#3b82f6",
  // Legs - Green
  quads: "#22c55e",
  glutes: "#22c55e",
  hamstrings: "#22c55e",
  // Accessory - Purple
  calves: "#a855f7",
  traps: "#a855f7",
  forearms: "#a855f7",
  abs: "#a855f7",
};

/**
 * Generates a CSS class name for a muscle group tag.
 *
 * @param muscleGroup - The muscle group to generate a class name for
 * @returns CSS class name in the format "tag-muscle-{muscleGroup}"
 *
 * @example
 * getMuscleGroupClassName("chest") // Returns "tag-muscle-chest"
 */
export function getMuscleGroupClassName(muscleGroup: MuscleGroup): string {
  return `tag-muscle-${muscleGroup}`;
}
