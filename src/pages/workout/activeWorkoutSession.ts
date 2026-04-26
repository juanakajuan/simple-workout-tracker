import type {
  Exercise,
  IntensityTechnique,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
} from "../../types";
import { removeExerciseWithIntensityCleanup } from "../../utils/intensityTechniques";
import {
  createTemplateExercise,
  insertTemplateExerciseAtPosition,
  moveTemplateExerciseByPosition,
  pairTemplateExercisesWithSupersetGroup,
  removeTemplateExercise,
  replaceTemplateExercise,
  setTemplateExerciseSetCountAtPosition,
  type TemplateIdentifierGenerator,
  unpairTemplateExerciseSuperset,
  updateTemplateExerciseIntensity,
  updateTemplateExercises,
} from "./templateComposition";

/** Creates stable identifiers for new active-workout entities. */
export type ActiveWorkoutIdentifierGenerator = () => string;

export type WorkoutExerciseMoveDirection = "up" | "down";

/**
 * Creates a workout exercise with one empty set.
 *
 * @param exerciseId - Exercise catalog identifier to add to the workout
 * @param generateIdentifier - Identifier generator for the workout exercise and first set
 * @returns New workout exercise ready for active-workout entry
 */
export function createWorkoutExercise(
  exerciseId: string,
  generateIdentifier: ActiveWorkoutIdentifierGenerator
): WorkoutExercise {
  return {
    id: generateIdentifier(),
    exerciseId,
    sets: [{ id: generateIdentifier(), weight: 0, reps: 0, completed: false }],
    intensityTechnique: null,
    supersetGroupId: null,
  };
}

/**
 * Adds an exercise to the active workout.
 *
 * @param workout - Active workout to update
 * @param exerciseId - Exercise catalog identifier to add
 * @param generateIdentifier - Identifier generator for created records
 * @returns Updated workout with the exercise appended
 */
export function addExerciseToActiveWorkout(
  workout: Workout,
  exerciseId: string,
  generateIdentifier: ActiveWorkoutIdentifierGenerator
): Workout {
  return {
    ...workout,
    exercises: [...workout.exercises, createWorkoutExercise(exerciseId, generateIdentifier)],
  };
}

/**
 * Moves a workout exercise one position within the active workout.
 *
 * @param workout - Active workout to update
 * @param workoutExerciseId - Workout exercise identifier to move
 * @param direction - Direction to move the exercise
 * @returns Updated workout and original/new indexes when a move occurred
 */
export function moveWorkoutExerciseInSession(
  workout: Workout,
  workoutExerciseId: string,
  direction: WorkoutExerciseMoveDirection
): { workout: Workout; fromIndex: number; toIndex: number } | null {
  const fromIndex = workout.exercises.findIndex((exercise) => exercise.id === workoutExerciseId);
  if (fromIndex === -1) return null;

  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (toIndex < 0 || toIndex >= workout.exercises.length) return null;

  const exercises = [...workout.exercises];
  [exercises[fromIndex], exercises[toIndex]] = [exercises[toIndex], exercises[fromIndex]];

  return { workout: { ...workout, exercises }, fromIndex, toIndex };
}

/**
 * Removes a workout exercise and clears paired intensity state.
 *
 * @param workout - Active workout to update
 * @param workoutExerciseId - Workout exercise identifier to remove
 * @returns Updated workout without the exercise
 */
export function removeExerciseFromActiveWorkout(
  workout: Workout,
  workoutExerciseId: string
): Workout {
  return {
    ...workout,
    exercises: removeExerciseWithIntensityCleanup(workout.exercises, workoutExerciseId),
  };
}

/**
 * Adds a set to a workout exercise, copying weight and reps from the previous set.
 *
 * @param workout - Active workout to update
 * @param workoutExerciseId - Workout exercise receiving the set
 * @param generateIdentifier - Identifier generator for the created set
 * @returns Updated workout
 */
export function addSetToWorkoutExercise(
  workout: Workout,
  workoutExerciseId: string,
  generateIdentifier: ActiveWorkoutIdentifierGenerator
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      if (exercise.id !== workoutExerciseId) return exercise;

      const lastSet = exercise.sets[exercise.sets.length - 1];

      return {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            id: generateIdentifier(),
            weight: lastSet?.weight ?? 0,
            reps: lastSet?.reps ?? 0,
            completed: false,
          },
        ],
      };
    }),
  };
}

/**
 * Updates one workout set with optional auto-matched weight behavior.
 *
 * @param workout - Active workout to update
 * @param workoutExerciseId - Workout exercise containing the set
 * @param workoutSetId - Set identifier to update
 * @param updates - Set fields to merge
 * @param shouldAutoMatchWeight - Whether weight edits should propagate to sibling sets
 * @returns Updated workout
 */
export function updateWorkoutSet(
  workout: Workout,
  workoutExerciseId: string,
  workoutSetId: string,
  updates: Partial<WorkoutSet>,
  shouldAutoMatchWeight: boolean
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      if (exercise.id !== workoutExerciseId) return exercise;

      if (shouldAutoMatchWeight && updates.weight !== undefined) {
        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.id === workoutSetId ? { ...set, ...updates } : { ...set, weight: updates.weight! }
          ),
        };
      }

      return {
        ...exercise,
        sets: exercise.sets.map((set) => (set.id === workoutSetId ? { ...set, ...updates } : set)),
      };
    }),
  };
}

/**
 * Removes a set from a workout exercise.
 *
 * @param workout - Active workout to update
 * @param workoutExerciseId - Workout exercise containing the set
 * @param workoutSetId - Set identifier to remove
 * @returns Updated workout
 */
export function removeWorkoutSet(
  workout: Workout,
  workoutExerciseId: string,
  workoutSetId: string
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      exercise.id === workoutExerciseId
        ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== workoutSetId) }
        : exercise
    ),
  };
}

/**
 * Replaces a workout exercise while preserving set count and intensity configuration.
 *
 * @param workout - Active workout to update
 * @param workoutExerciseId - Workout exercise to replace
 * @param exerciseId - Replacement exercise catalog identifier
 * @returns Updated workout and replaced exercise index, or null when not found
 */
export function replaceExerciseInActiveWorkout(
  workout: Workout,
  workoutExerciseId: string,
  exerciseId: string
): { workout: Workout; exerciseIndex: number } | null {
  const exerciseIndex = workout.exercises.findIndex(
    (exercise) => exercise.id === workoutExerciseId
  );
  if (exerciseIndex === -1) return null;

  const oldWorkoutExercise = workout.exercises[exerciseIndex];
  const sets = oldWorkoutExercise.sets.map((set) => ({
    ...set,
    weight: 0,
    reps: 0,
    completed: false,
    skipped: false,
  }));

  return {
    workout: {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.id === workoutExerciseId ? { ...exercise, exerciseId, sets } : exercise
      ),
    },
    exerciseIndex,
  };
}

/**
 * Marks every unresolved set in a workout exercise as skipped.
 *
 * @param workout - Active workout to update
 * @param workoutExerciseId - Workout exercise whose sets should be skipped
 * @returns Updated workout
 */
export function skipRemainingWorkoutExerciseSets(
  workout: Workout,
  workoutExerciseId: string
): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) =>
      exercise.id === workoutExerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              !set.completed && !set.skipped ? { ...set, skipped: true } : set
            ),
          }
        : exercise
    ),
  };
}

/**
 * Converts an active workout into a completed historical workout.
 *
 * @param workout - Active workout to complete
 * @param workoutName - User-edited workout name
 * @param exercisesById - Exercise catalog lookup for historical snapshots
 * @param completedAt - Completion timestamp
 * @returns Completed workout ready for history persistence
 */
export function completeActiveWorkout(
  workout: Workout,
  workoutName: string,
  exercisesById: ReadonlyMap<string, Exercise>,
  completedAt: Date
): Workout {
  const startTime = new Date(workout.startTime);
  const durationInSeconds = Math.floor((completedAt.getTime() - startTime.getTime()) / 1000);
  const completedAtIsoString = completedAt.toISOString();

  return {
    ...workout,
    name: workoutName || workout.name,
    date: completedAtIsoString,
    duration: durationInSeconds,
    completed: true,
    exercises: workout.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      exerciseSnapshot:
        exercisesById.get(workoutExercise.exerciseId) ?? workoutExercise.exerciseSnapshot,
    })),
  };
}

/**
 * Moves a template exercise by the same flat position used by the active workout.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @param fromIndex - Current flat exercise position
 * @param toIndex - Target flat exercise position
 * @returns Updated template list
 */
export function moveTemplateExerciseForActiveWorkout(
  templates: WorkoutTemplate[],
  templateId: string,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator,
  fromIndex: number,
  toIndex: number
): WorkoutTemplate[] {
  return updateTemplateExercises(
    templates,
    templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) => moveTemplateExerciseByPosition(templateExercises, fromIndex, toIndex)
  );
}

/**
 * Aligns a template exercise set count with its matching active workout position.
 *
 * @param templates - Current workout templates
 * @param workout - Active workout after the set-count change
 * @param workoutExerciseId - Workout exercise whose set count changed
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @returns Updated template list
 */
export function syncTemplateSetCountForActiveWorkoutExercise(
  templates: WorkoutTemplate[],
  workout: Workout,
  workoutExerciseId: string,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): WorkoutTemplate[] {
  if (!workout.templateId) return templates;

  const exercisePosition = workout.exercises.findIndex(
    (exercise) => exercise.id === workoutExerciseId
  );
  if (exercisePosition === -1) return templates;

  return updateTemplateExercises(
    templates,
    workout.templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) =>
      setTemplateExerciseSetCountAtPosition(
        templateExercises,
        exercisePosition,
        workout.exercises[exercisePosition].sets.length
      )
  );
}

/**
 * Replaces the template exercise at an active workout position.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param exercisePosition - Flat exercise position from the active workout
 * @param exerciseId - Replacement exercise catalog identifier
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @returns Updated template list
 */
export function replaceTemplateExerciseForActiveWorkout(
  templates: WorkoutTemplate[],
  templateId: string,
  exercisePosition: number,
  exerciseId: string,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): WorkoutTemplate[] {
  return updateTemplateExercises(
    templates,
    templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) =>
      templateExercises[exercisePosition]
        ? replaceTemplateExercise(
            templateExercises,
            templateExercises[exercisePosition].id,
            exerciseId
          )
        : templateExercises
  );
}

/**
 * Removes the template exercise at an active workout position.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param exercisePosition - Flat exercise position from the active workout
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @returns Updated template list
 */
export function removeTemplateExerciseForActiveWorkout(
  templates: WorkoutTemplate[],
  templateId: string,
  exercisePosition: number,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): WorkoutTemplate[] {
  return updateTemplateExercises(
    templates,
    templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) => {
      const targetExercise = templateExercises[exercisePosition];
      if (!targetExercise) return templateExercises;

      return removeTemplateExercise(templateExercises, targetExercise.id);
    }
  );
}

/**
 * Inserts a template exercise at the active workout insertion position.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param exercise - Exercise to add to the template
 * @param exercisePosition - Flat active-workout insertion position
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @param generateIdentifier - Identifier generator for the template exercise
 * @returns Updated template list
 */
export function addTemplateExerciseForActiveWorkout(
  templates: WorkoutTemplate[],
  templateId: string,
  exercise: Exercise,
  exercisePosition: number,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): WorkoutTemplate[] {
  return updateTemplateExercises(
    templates,
    templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) => {
      const insertedExercise = createTemplateExercise(exercise.id, generateIdentifier);

      return insertTemplateExerciseAtPosition(
        templateExercises,
        insertedExercise,
        exercisePosition
      );
    }
  );
}

/**
 * Updates template intensity at the active workout exercise position.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param exercisePosition - Flat exercise position from the active workout
 * @param intensityTechnique - Intensity technique to apply
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @returns Updated template list
 */
export function updateTemplateExerciseIntensityForActiveWorkout(
  templates: WorkoutTemplate[],
  templateId: string,
  exercisePosition: number,
  intensityTechnique: IntensityTechnique | null,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): WorkoutTemplate[] {
  return updateTemplateExercises(
    templates,
    templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) => {
      const targetExercise = templateExercises[exercisePosition];
      if (!targetExercise) return templateExercises;

      return updateTemplateExerciseIntensity(
        templateExercises,
        targetExercise.id,
        intensityTechnique
      );
    }
  );
}

/**
 * Pairs two template exercises as a superset using active workout positions.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param firstExercisePosition - First flat exercise position from the active workout
 * @param secondExercisePosition - Second flat exercise position from the active workout
 * @param supersetGroupId - Shared superset identifier
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @returns Updated template list
 */
export function pairTemplateSupersetForActiveWorkout(
  templates: WorkoutTemplate[],
  templateId: string,
  firstExercisePosition: number,
  secondExercisePosition: number,
  supersetGroupId: string,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): WorkoutTemplate[] {
  return updateTemplateExercises(
    templates,
    templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) => {
      const firstExercise = templateExercises[firstExercisePosition];
      const secondExercise = templateExercises[secondExercisePosition];

      if (!firstExercise || !secondExercise) return templateExercises;

      return pairTemplateExercisesWithSupersetGroup(
        templateExercises,
        firstExercise.id,
        secondExercise.id,
        supersetGroupId
      );
    }
  );
}

/**
 * Unpairs a template superset using the active workout exercise position.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param exercisePosition - Flat exercise position from the active workout
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @returns Updated template list
 */
export function unpairTemplateSupersetForActiveWorkout(
  templates: WorkoutTemplate[],
  templateId: string,
  exercisePosition: number,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): WorkoutTemplate[] {
  return updateTemplateExercises(
    templates,
    templateId,
    exercisesById,
    generateIdentifier,
    (templateExercises) => {
      const targetExercise = templateExercises[exercisePosition];
      if (!targetExercise) return templateExercises;

      return unpairTemplateExerciseSuperset(templateExercises, targetExercise.id);
    }
  );
}
