import type { Exercise, Workout, WorkoutTemplate } from "../../types";
import {
  addExerciseToActiveWorkout,
  addSetToWorkoutExercise,
  addTemplateExerciseForActiveWorkout,
  moveTemplateExerciseForActiveWorkout,
  moveWorkoutExerciseInSession,
  removeExerciseFromActiveWorkout,
  removeTemplateExerciseForActiveWorkout,
  removeWorkoutSet,
  replaceExerciseInActiveWorkout,
  replaceTemplateExerciseForActiveWorkout,
  syncTemplateSetCountForActiveWorkoutExercise,
  type ActiveWorkoutIdentifierGenerator,
  type WorkoutExerciseMoveDirection,
} from "./activeWorkoutSession";

export type TemplateSynchronizationDecision = "synchronizeTemplate" | "leaveTemplateUnchanged";

export interface ActiveWorkoutEditingState {
  workout: Workout;
  templates: WorkoutTemplate[];
  exercisesByIdentifier: ReadonlyMap<string, Exercise>;
  generateIdentifier: ActiveWorkoutIdentifierGenerator;
}

export interface ActiveWorkoutEditingResult {
  workout: Workout;
  templates: WorkoutTemplate[];
}

/**
 * Adds an exercise to the active workout and optionally inserts it into the
 * source template at the same active-workout position.
 *
 * @param state - Current workout, templates, catalog lookup, and identifier generator
 * @param exerciseIdentifier - Exercise catalog identifier to add
 * @param templateSynchronizationDecision - Whether to synchronize the source template
 * @returns Updated workout and template collection
 */
export function addExerciseToActiveWorkoutEditingState(
  state: ActiveWorkoutEditingState,
  exerciseIdentifier: string,
  templateSynchronizationDecision: TemplateSynchronizationDecision
): ActiveWorkoutEditingResult {
  const updatedWorkout = addExerciseToActiveWorkout(
    state.workout,
    exerciseIdentifier,
    state.generateIdentifier
  );

  if (templateSynchronizationDecision === "leaveTemplateUnchanged" || !state.workout.templateId) {
    return { workout: updatedWorkout, templates: state.templates };
  }

  const exercise = state.exercisesByIdentifier.get(exerciseIdentifier);
  if (!exercise) {
    return { workout: updatedWorkout, templates: state.templates };
  }

  return {
    workout: updatedWorkout,
    templates: addTemplateExerciseForActiveWorkout(
      state.templates,
      state.workout.templateId,
      exercise,
      state.workout.exercises.length,
      state.exercisesByIdentifier,
      state.generateIdentifier
    ),
  };
}

/**
 * Moves an active-workout exercise and automatically mirrors the position
 * change into the source template when the workout came from one.
 *
 * @param state - Current workout, templates, catalog lookup, and identifier generator
 * @param workoutExerciseIdentifier - Workout exercise identifier to move
 * @param direction - Direction to move the workout exercise
 * @returns Updated workout and template collection, or null when the move is invalid
 */
export function moveExerciseInActiveWorkoutEditingState(
  state: ActiveWorkoutEditingState,
  workoutExerciseIdentifier: string,
  direction: WorkoutExerciseMoveDirection
): ActiveWorkoutEditingResult | null {
  const result = moveWorkoutExerciseInSession(state.workout, workoutExerciseIdentifier, direction);
  if (!result) return null;

  if (!state.workout.templateId) {
    return { workout: result.workout, templates: state.templates };
  }

  return {
    workout: result.workout,
    templates: moveTemplateExerciseForActiveWorkout(
      state.templates,
      state.workout.templateId,
      state.exercisesByIdentifier,
      state.generateIdentifier,
      result.fromIndex,
      result.toIndex
    ),
  };
}

/**
 * Replaces an active-workout exercise and optionally replaces the matching
 * source-template exercise at the same active-workout position.
 *
 * @param state - Current workout, templates, catalog lookup, and identifier generator
 * @param workoutExerciseIdentifier - Workout exercise identifier to replace
 * @param exerciseIdentifier - Replacement exercise catalog identifier
 * @param templateSynchronizationDecision - Whether to synchronize the source template
 * @returns Updated workout and template collection, or null when no workout exercise matches
 */
export function replaceExerciseInActiveWorkoutEditingState(
  state: ActiveWorkoutEditingState,
  workoutExerciseIdentifier: string,
  exerciseIdentifier: string,
  templateSynchronizationDecision: TemplateSynchronizationDecision
): ActiveWorkoutEditingResult | null {
  const result = replaceExerciseInActiveWorkout(
    state.workout,
    workoutExerciseIdentifier,
    exerciseIdentifier
  );
  if (!result) return null;

  if (templateSynchronizationDecision === "leaveTemplateUnchanged" || !state.workout.templateId) {
    return { workout: result.workout, templates: state.templates };
  }

  return {
    workout: result.workout,
    templates: replaceTemplateExerciseForActiveWorkout(
      state.templates,
      state.workout.templateId,
      result.exerciseIndex,
      exerciseIdentifier,
      state.exercisesByIdentifier,
      state.generateIdentifier
    ),
  };
}

/**
 * Removes an active-workout exercise and optionally removes the matching
 * source-template exercise at the same active-workout position.
 *
 * @param state - Current workout, templates, catalog lookup, and identifier generator
 * @param workoutExerciseIdentifier - Workout exercise identifier to remove
 * @param templateSynchronizationDecision - Whether to synchronize the source template
 * @returns Updated workout and template collection, or null when no workout exercise matches
 */
export function removeExerciseFromActiveWorkoutEditingState(
  state: ActiveWorkoutEditingState,
  workoutExerciseIdentifier: string,
  templateSynchronizationDecision: TemplateSynchronizationDecision
): ActiveWorkoutEditingResult | null {
  const exercisePosition = state.workout.exercises.findIndex(
    (exercise) => exercise.id === workoutExerciseIdentifier
  );
  if (exercisePosition === -1) return null;

  const updatedWorkout = removeExerciseFromActiveWorkout(state.workout, workoutExerciseIdentifier);

  if (templateSynchronizationDecision === "leaveTemplateUnchanged" || !state.workout.templateId) {
    return { workout: updatedWorkout, templates: state.templates };
  }

  return {
    workout: updatedWorkout,
    templates: removeTemplateExerciseForActiveWorkout(
      state.templates,
      state.workout.templateId,
      exercisePosition,
      state.exercisesByIdentifier,
      state.generateIdentifier
    ),
  };
}

/**
 * Adds a set to an active-workout exercise and automatically synchronizes the
 * source-template set count when the workout came from a template.
 *
 * @param state - Current workout, templates, catalog lookup, and identifier generator
 * @param workoutExerciseIdentifier - Workout exercise receiving the new set
 * @returns Updated workout and template collection, or null when no workout exercise matches
 */
export function addSetToActiveWorkoutEditingState(
  state: ActiveWorkoutEditingState,
  workoutExerciseIdentifier: string
): ActiveWorkoutEditingResult | null {
  if (!hasWorkoutExercise(state.workout, workoutExerciseIdentifier)) {
    return null;
  }

  const updatedWorkout = addSetToWorkoutExercise(
    state.workout,
    workoutExerciseIdentifier,
    state.generateIdentifier
  );

  return {
    workout: updatedWorkout,
    templates: synchronizeTemplateSetCount(state, updatedWorkout, workoutExerciseIdentifier),
  };
}

/**
 * Removes a set from an active-workout exercise and automatically synchronizes
 * the source-template set count when the workout came from a template.
 *
 * @param state - Current workout, templates, catalog lookup, and identifier generator
 * @param workoutExerciseIdentifier - Workout exercise containing the set
 * @param workoutSetIdentifier - Workout set identifier to remove
 * @returns Updated workout and template collection, or null when no workout exercise matches
 */
export function removeSetFromActiveWorkoutEditingState(
  state: ActiveWorkoutEditingState,
  workoutExerciseIdentifier: string,
  workoutSetIdentifier: string
): ActiveWorkoutEditingResult | null {
  if (!hasWorkoutExercise(state.workout, workoutExerciseIdentifier)) {
    return null;
  }

  const updatedWorkout = removeWorkoutSet(
    state.workout,
    workoutExerciseIdentifier,
    workoutSetIdentifier
  );

  return {
    workout: updatedWorkout,
    templates: synchronizeTemplateSetCount(state, updatedWorkout, workoutExerciseIdentifier),
  };
}

function hasWorkoutExercise(workout: Workout, workoutExerciseIdentifier: string): boolean {
  return workout.exercises.some((exercise) => exercise.id === workoutExerciseIdentifier);
}

function synchronizeTemplateSetCount(
  state: ActiveWorkoutEditingState,
  updatedWorkout: Workout,
  workoutExerciseIdentifier: string
): WorkoutTemplate[] {
  return syncTemplateSetCountForActiveWorkoutExercise(
    state.templates,
    updatedWorkout,
    workoutExerciseIdentifier,
    state.exercisesByIdentifier,
    state.generateIdentifier
  );
}
