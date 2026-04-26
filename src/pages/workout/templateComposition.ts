import type {
  Exercise,
  IntensityTechnique,
  TemplateExercise,
  TemplateMuscleGroup,
  WorkoutTemplate,
} from "../../types";
import {
  pairExercisesAsSuperset,
  removeExerciseWithIntensityCleanup,
  setExerciseIntensityTechnique,
  unpairSupersetExercise,
} from "../../utils/intensityTechniques";

export type TemplateIdentifierGenerator = () => string;

export type TemplateExerciseMoveDirection = "up" | "down";

type TemplateExerciseUpdater = (templateExercises: TemplateExercise[]) => TemplateExercise[];

const minimumTemplateSetCount = 1;
const maximumTemplateSetCount = 20;

/**
 * Flattens a template's grouped exercises into display order.
 *
 * @param template - Template to flatten
 * @returns Flat template exercise list copied from the template
 */
export function flattenTemplateExercises(template: WorkoutTemplate): TemplateExercise[] {
  return flattenTemplateMuscleGroups(template.muscleGroups);
}

/**
 * Flattens template muscle groups into display order.
 *
 * @param muscleGroups - Grouped template exercises
 * @returns Flat template exercise list copied from the groups
 */
export function flattenTemplateMuscleGroups(
  muscleGroups: TemplateMuscleGroup[]
): TemplateExercise[] {
  return muscleGroups.flatMap((muscleGroup) =>
    muscleGroup.exercises.map((exercise) => ({ ...exercise }))
  );
}

/**
 * Rebuilds template muscle groups from flat exercise order.
 *
 * @param templateExercises - Flat template exercises in display order
 * @param exercisesById - Exercise lookup used to recover muscle groups
 * @param generateIdentifier - Identifier generator for rebuilt muscle groups
 * @returns Grouped muscle-group structure for template persistence
 */
export function buildTemplateMuscleGroups(
  templateExercises: TemplateExercise[],
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator
): TemplateMuscleGroup[] {
  const muscleGroups: TemplateMuscleGroup[] = [];

  templateExercises.forEach((templateExercise) => {
    if (!templateExercise.exerciseId) return;

    const exercise = exercisesById.get(templateExercise.exerciseId);
    if (!exercise) return;

    const previousMuscleGroup = muscleGroups[muscleGroups.length - 1];
    if (previousMuscleGroup?.muscleGroup === exercise.muscleGroup) {
      previousMuscleGroup.exercises.push({ ...templateExercise });
      return;
    }

    muscleGroups.push({
      id: generateIdentifier(),
      muscleGroup: exercise.muscleGroup,
      exercises: [{ ...templateExercise }],
    });
  });

  return muscleGroups;
}

/**
 * Applies a flat exercise update to one template, then rebuilds its groups.
 *
 * @param templates - Current workout templates
 * @param templateId - Template to update
 * @param exercisesById - Exercise lookup used to rebuild muscle groups
 * @param generateIdentifier - Identifier generator for rebuilt muscle groups
 * @param updater - Flat template exercise mutation
 * @returns Updated template list
 */
export function updateTemplateExercises(
  templates: WorkoutTemplate[],
  templateId: string,
  exercisesById: ReadonlyMap<string, Exercise>,
  generateIdentifier: TemplateIdentifierGenerator,
  updater: TemplateExerciseUpdater
): WorkoutTemplate[] {
  const template = templates.find((item) => item.id === templateId);
  if (!template) return templates;

  const updatedTemplateExercises = updater(flattenTemplateExercises(template));

  return templates.map((item) =>
    item.id === templateId
      ? {
          ...item,
          muscleGroups: buildTemplateMuscleGroups(
            updatedTemplateExercises,
            exercisesById,
            generateIdentifier
          ),
        }
      : item
  );
}

/**
 * Creates a template exercise with the default set count.
 *
 * @param exerciseId - Exercise catalog identifier
 * @param generateIdentifier - Identifier generator for the template exercise
 * @returns New template exercise
 */
export function createTemplateExercise(
  exerciseId: string,
  generateIdentifier: TemplateIdentifierGenerator
): TemplateExercise {
  return {
    id: generateIdentifier(),
    exerciseId,
    setCount: 3,
  };
}

/**
 * Replaces a template exercise's selected catalog exercise.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - Template exercise to update
 * @param exerciseId - Replacement exercise catalog identifier
 * @returns Updated flat template exercise list
 */
export function replaceTemplateExercise(
  templateExercises: TemplateExercise[],
  templateExerciseId: string,
  exerciseId: string
): TemplateExercise[] {
  return templateExercises.map((exercise) =>
    exercise.id === templateExerciseId ? { ...exercise, exerciseId } : exercise
  );
}

/**
 * Appends a template exercise.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExercise - Template exercise to append
 * @returns Updated flat template exercise list
 */
export function appendTemplateExercise(
  templateExercises: TemplateExercise[],
  templateExercise: TemplateExercise
): TemplateExercise[] {
  return [...templateExercises, templateExercise];
}

/**
 * Inserts a template exercise at a flat position.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExercise - Template exercise to insert
 * @param exercisePosition - Target flat position
 * @returns Updated flat template exercise list
 */
export function insertTemplateExerciseAtPosition(
  templateExercises: TemplateExercise[],
  templateExercise: TemplateExercise,
  exercisePosition: number
): TemplateExercise[] {
  const insertionIndex = Math.min(Math.max(exercisePosition, 0), templateExercises.length);
  const updatedTemplateExercises = [...templateExercises];

  updatedTemplateExercises.splice(insertionIndex, 0, templateExercise);

  return updatedTemplateExercises;
}

/**
 * Removes a template exercise and clears paired intensity state.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - Template exercise to remove
 * @returns Updated flat template exercise list
 */
export function removeTemplateExercise(
  templateExercises: TemplateExercise[],
  templateExerciseId: string
): TemplateExercise[] {
  return removeExerciseWithIntensityCleanup(templateExercises, templateExerciseId);
}

/**
 * Moves a template exercise by one position.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - Template exercise to move
 * @param direction - Direction to move the exercise
 * @returns Updated flat template exercise list
 */
export function moveTemplateExercise(
  templateExercises: TemplateExercise[],
  templateExerciseId: string,
  direction: TemplateExerciseMoveDirection
): TemplateExercise[] {
  const currentIndex = templateExercises.findIndex(
    (exercise) => exercise.id === templateExerciseId
  );
  if (currentIndex === -1) return templateExercises;

  const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  return moveTemplateExerciseByPosition(templateExercises, currentIndex, newIndex);
}

/**
 * Moves a template exercise from one flat position to another.
 *
 * @param templateExercises - Flat template exercise list
 * @param fromIndex - Source flat position
 * @param toIndex - Target flat position
 * @returns Updated flat template exercise list
 */
export function moveTemplateExerciseByPosition(
  templateExercises: TemplateExercise[],
  fromIndex: number,
  toIndex: number
): TemplateExercise[] {
  if (fromIndex < 0 || toIndex < 0) return templateExercises;
  if (fromIndex >= templateExercises.length || toIndex >= templateExercises.length) {
    return templateExercises;
  }

  const updatedTemplateExercises = [...templateExercises];
  [updatedTemplateExercises[fromIndex], updatedTemplateExercises[toIndex]] = [
    updatedTemplateExercises[toIndex],
    updatedTemplateExercises[fromIndex],
  ];

  return updatedTemplateExercises;
}

/**
 * Updates a template exercise set count within supported bounds.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - Template exercise to update
 * @param delta - Set-count delta to apply
 * @returns Updated flat template exercise list
 */
export function updateTemplateExerciseSetCount(
  templateExercises: TemplateExercise[],
  templateExerciseId: string,
  delta: number
): TemplateExercise[] {
  return templateExercises.map((exercise) => {
    if (exercise.id !== templateExerciseId) return exercise;

    const setCount = Math.max(
      minimumTemplateSetCount,
      Math.min(maximumTemplateSetCount, exercise.setCount + delta)
    );
    return { ...exercise, setCount };
  });
}

/**
 * Sets the exact set count for a template exercise at a flat position.
 *
 * @param templateExercises - Flat template exercise list
 * @param exercisePosition - Flat exercise position
 * @param setCount - Exact set count to assign
 * @returns Updated flat template exercise list
 */
export function setTemplateExerciseSetCountAtPosition(
  templateExercises: TemplateExercise[],
  exercisePosition: number,
  setCount: number
): TemplateExercise[] {
  return templateExercises.map((exercise, exerciseIndex) =>
    exerciseIndex === exercisePosition ? { ...exercise, setCount } : exercise
  );
}

/**
 * Updates template exercise intensity.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - Template exercise to update
 * @param intensityTechnique - Intensity technique to apply
 * @returns Updated flat template exercise list
 */
export function updateTemplateExerciseIntensity(
  templateExercises: TemplateExercise[],
  templateExerciseId: string,
  intensityTechnique: IntensityTechnique | null
): TemplateExercise[] {
  return setExerciseIntensityTechnique(templateExercises, templateExerciseId, intensityTechnique);
}

/**
 * Pairs two template exercises as a superset.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - First template exercise identifier
 * @param partnerTemplateExerciseId - Partner template exercise identifier
 * @param generateIdentifier - Identifier generator for a new superset group when needed
 * @returns Updated flat template exercise list
 */
export function pairTemplateExercisesAsSuperset(
  templateExercises: TemplateExercise[],
  templateExerciseId: string,
  partnerTemplateExerciseId: string,
  generateIdentifier: TemplateIdentifierGenerator
): TemplateExercise[] {
  const currentExercise = templateExercises.find((exercise) => exercise.id === templateExerciseId);
  const partnerExercise = templateExercises.find(
    (exercise) => exercise.id === partnerTemplateExerciseId
  );

  if (!currentExercise || !partnerExercise) return templateExercises;

  const supersetGroupId =
    currentExercise.supersetGroupId ?? partnerExercise.supersetGroupId ?? generateIdentifier();

  return pairTemplateExercisesWithSupersetGroup(
    templateExercises,
    templateExerciseId,
    partnerTemplateExerciseId,
    supersetGroupId
  );
}

/**
 * Pairs two template exercises using an existing superset group identifier.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - First template exercise identifier
 * @param partnerTemplateExerciseId - Partner template exercise identifier
 * @param supersetGroupId - Superset group identifier to share
 * @returns Updated flat template exercise list
 */
export function pairTemplateExercisesWithSupersetGroup(
  templateExercises: TemplateExercise[],
  templateExerciseId: string,
  partnerTemplateExerciseId: string,
  supersetGroupId: string
): TemplateExercise[] {
  return pairExercisesAsSuperset(
    templateExercises,
    templateExerciseId,
    partnerTemplateExerciseId,
    supersetGroupId
  );
}

/**
 * Unpairs a template exercise from its superset partner.
 *
 * @param templateExercises - Flat template exercise list
 * @param templateExerciseId - Template exercise to unpair
 * @returns Updated flat template exercise list
 */
export function unpairTemplateExerciseSuperset(
  templateExercises: TemplateExercise[],
  templateExerciseId: string
): TemplateExercise[] {
  return unpairSupersetExercise(templateExercises, templateExerciseId);
}

/**
 * Validates whether every superset exercise has exactly one partner.
 *
 * @param templateExercises - Flat template exercise list
 * @returns Validation error text, or an empty string when valid
 */
export function getSupersetValidationError(templateExercises: TemplateExercise[]): string {
  const supersetCounts = templateExercises.reduce((counts, exercise) => {
    if (exercise.intensityTechnique === "super-set" && exercise.supersetGroupId) {
      counts.set(exercise.supersetGroupId, (counts.get(exercise.supersetGroupId) ?? 0) + 1);
    }

    return counts;
  }, new Map<string, number>());

  const hasIncompleteSuperset = templateExercises.some((exercise) => {
    if (exercise.intensityTechnique !== "super-set") return false;
    if (!exercise.supersetGroupId) return true;

    return supersetCounts.get(exercise.supersetGroupId) !== 2;
  });

  return hasIncompleteSuperset ? "Please pair every superset exercise before saving" : "";
}
