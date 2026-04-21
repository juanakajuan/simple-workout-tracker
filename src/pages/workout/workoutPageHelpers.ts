import type {
  Exercise,
  IntensityTechnique,
  TemplateExercise,
  TemplateMuscleGroup,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
} from "../../types";
import { generateId } from "../../utils/storage";

/** Stores the selected plate-calculator set for each workout exercise. */
export type PlateCalculatorSelections = Record<string, string>;

/** Captures the last logged weight and reps for a set position. */
export interface LastPerformedSet {
  weight: number;
  reps: number;
}

/** Represents the selector return state used by WorkoutPage navigation. */
export interface WorkoutPageSelectorState {
  selectedExerciseId?: string;
  updateTemplate?: boolean;
  replacementWorkoutExerciseId?: string;
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Creates a new empty workout with the app's default weekday-based name.
 *
 * @param now - Date used for naming and timestamps
 * @returns New active workout scaffold
 */
export function createEmptyWorkout(now: Date = new Date()): Workout {
  const defaultName = `${dayNames[now.getDay()]} Workout`;

  return {
    id: generateId(),
    name: defaultName,
    date: now.toISOString(),
    startTime: now.toISOString(),
    exercises: [],
    completed: false,
  };
}

/**
 * Merges built-in and user exercises while letting user entries override defaults.
 *
 * @param defaultExercises - Built-in exercise catalog
 * @param userExercises - User-managed exercise entries and overrides
 * @returns Combined exercise list used throughout the workout flow
 */
export function mergeAvailableExercises(
  defaultExercises: readonly Exercise[],
  userExercises: Exercise[]
): Exercise[] {
  const userExercisesById = new Map(userExercises.map((exercise) => [exercise.id, exercise]));

  const mergedDefaultExercises = defaultExercises.map(
    (defaultExercise) => userExercisesById.get(defaultExercise.id) ?? defaultExercise
  );
  const customExercises = userExercises.filter((exercise) => !exercise.id.startsWith("default-"));

  return [...mergedDefaultExercises, ...customExercises];
}

/**
 * Returns a new array with two positions swapped.
 *
 * @param items - Array to reorder
 * @param fromIndex - Original index
 * @param toIndex - Target index
 * @returns Reordered array copy
 */
export function swapItems<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  const reorderedItems = [...items];
  [reorderedItems[fromIndex], reorderedItems[toIndex]] = [
    reorderedItems[toIndex],
    reorderedItems[fromIndex],
  ];
  return reorderedItems;
}

/**
 * Rebuilds template muscle groups from a flat exercise list while preserving order.
 *
 * @param templateExercises - Flat template exercises in workout order
 * @param exercisesById - Exercise lookup used to recover muscle groups
 * @returns Grouped muscle-group structure for template persistence
 */
export function buildTemplateMuscleGroups(
  templateExercises: TemplateExercise[],
  exercisesById: ReadonlyMap<string, Exercise>
): TemplateMuscleGroup[] {
  const muscleGroups: TemplateMuscleGroup[] = [];

  templateExercises.forEach((templateExercise) => {
    if (!templateExercise.exerciseId) {
      return;
    }

    const exercise = exercisesById.get(templateExercise.exerciseId);
    if (!exercise) {
      return;
    }

    const previousMuscleGroup = muscleGroups[muscleGroups.length - 1];
    if (previousMuscleGroup?.muscleGroup === exercise.muscleGroup) {
      previousMuscleGroup.exercises.push({ ...templateExercise });
      return;
    }

    muscleGroups.push({
      id: generateId(),
      muscleGroup: exercise.muscleGroup,
      exercises: [{ ...templateExercise }],
    });
  });

  return muscleGroups;
}

/**
 * Flattens a template's muscle-group structure into workout order.
 *
 * @param template - Template to flatten
 * @returns Flat exercise list copied from the template
 */
export function flattenTemplateExercises(template: WorkoutTemplate): TemplateExercise[] {
  return template.muscleGroups.flatMap((muscleGroup) =>
    muscleGroup.exercises.map((exercise) => ({ ...exercise }))
  );
}

/**
 * Finds exercises available to replace a workout exercise while keeping the same muscle group.
 *
 * @param activeWorkout - Current active workout
 * @param allExercises - Full exercise list available to the selector
 * @param exercisesById - Exercise lookup for the current catalog
 * @param workoutExerciseId - Workout exercise being replaced
 * @returns Replacement candidates filtered by muscle group when possible
 */
export function getReplacementExercises(
  activeWorkout: Workout | null,
  allExercises: Exercise[],
  exercisesById: ReadonlyMap<string, Exercise>,
  workoutExerciseId: string
): Exercise[] {
  const targetWorkoutExercise = activeWorkout?.exercises.find(
    (exercise) => exercise.id === workoutExerciseId
  );
  const muscleGroup = targetWorkoutExercise
    ? exercisesById.get(targetWorkoutExercise.exerciseId)?.muscleGroup
    : undefined;

  if (!muscleGroup) {
    return allExercises;
  }

  return allExercises.filter((exercise) => exercise.muscleGroup === muscleGroup);
}

/**
 * Checks whether every set in a workout has been either completed or skipped.
 *
 * @param workout - Workout to inspect
 * @returns True when the workout has exercises and all sets are resolved
 */
export function areAllWorkoutSetsCompleted(workout: Workout | null): boolean {
  if (!workout || workout.exercises.length === 0) {
    return false;
  }

  return workout.exercises.every((workoutExercise) =>
    workoutExercise.sets.every((set) => set.completed || set.skipped)
  );
}

/**
 * Formats a workout date for the header display.
 *
 * @param isoDateString - Workout date string
 * @returns Localized date label used in the workout header
 */
export function formatWorkoutDate(isoDateString: string): string {
  return new Date(isoDateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Finds the latest completed workout sets for each active exercise identifier.
 *
 * @param activeExerciseIdsKey - Joined active exercise identifiers used as memo input
 * @param workouts - Workout history
 * @returns Last logged sets keyed by exercise identifier
 */
export function getLastPerformedSetsByExerciseId(
  activeExerciseIdsKey: string,
  workouts: Workout[]
): Record<string, LastPerformedSet[] | null> {
  if (activeExerciseIdsKey === "") {
    return {};
  }

  const exerciseIds = new Set(activeExerciseIdsKey.split("\u0000"));
  const latestWorkoutTimesByExerciseId = new Map<string, number>();
  const lastSetsByExerciseId: Record<string, LastPerformedSet[] | null> = {};

  workouts.forEach((workout) => {
    if (!workout.completed) {
      return;
    }

    const workoutTime = new Date(workout.date).getTime();

    workout.exercises.forEach((workoutExercise) => {
      if (!exerciseIds.has(workoutExercise.exerciseId)) {
        return;
      }

      const latestWorkoutTime =
        latestWorkoutTimesByExerciseId.get(workoutExercise.exerciseId) ?? -Infinity;
      if (workoutTime <= latestWorkoutTime) {
        return;
      }

      latestWorkoutTimesByExerciseId.set(workoutExercise.exerciseId, workoutTime);
      lastSetsByExerciseId[workoutExercise.exerciseId] =
        workoutExercise.sets.length === 0
          ? null
          : workoutExercise.sets.map((set) => ({ weight: set.weight, reps: set.reps }));
    });
  });

  return lastSetsByExerciseId;
}

/**
 * Resolves the display label for a workout exercise's active intensity technique.
 *
 * @param workoutExercise - Exercise entry in the active workout
 * @param supersetLabel - Superset label to show when paired
 * @param intensityTechniqueLabels - Display labels keyed by technique
 * @returns Visible tag label for the technique trigger
 */
export function getWorkoutTechniqueLabel(
  workoutExercise: WorkoutExercise,
  supersetLabel: string | null,
  intensityTechniqueLabels: Record<IntensityTechnique, string>
): string {
  if (workoutExercise.intensityTechnique === "super-set" && supersetLabel) {
    return supersetLabel;
  }

  if (workoutExercise.intensityTechnique) {
    return intensityTechniqueLabels[workoutExercise.intensityTechnique];
  }

  return "Standard";
}
