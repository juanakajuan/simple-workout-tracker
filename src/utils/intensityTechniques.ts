import type { IntensityTechnique } from "../types";

export interface IntensityConfiguredExercise {
  id: string;
  intensityTechnique?: IntensityTechnique | null;
  supersetGroupId?: string | null;
}

function clearSupersetPair<T extends IntensityConfiguredExercise>(
  exercises: T[],
  exerciseId: string
): T[] {
  const currentExercise = exercises.find((exercise) => exercise.id === exerciseId);
  const supersetGroupId = currentExercise?.supersetGroupId ?? null;

  if (!supersetGroupId) {
    return exercises.map((exercise) =>
      exercise.id === exerciseId ? { ...exercise, supersetGroupId: null } : exercise
    );
  }

  return exercises.map((exercise) => {
    if (exercise.supersetGroupId !== supersetGroupId) {
      return exercise;
    }

    return {
      ...exercise,
      intensityTechnique: null,
      supersetGroupId: null,
    };
  });
}

export function setExerciseIntensityTechnique<T extends IntensityConfiguredExercise>(
  exercises: T[],
  exerciseId: string,
  intensityTechnique: IntensityTechnique | null
): T[] {
  if (intensityTechnique === "super-set") {
    return exercises.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            intensityTechnique,
            supersetGroupId: exercise.supersetGroupId ?? null,
          }
        : exercise
    );
  }

  const detachedExercises = clearSupersetPair(exercises, exerciseId);

  return detachedExercises.map((exercise) =>
    exercise.id === exerciseId
      ? {
          ...exercise,
          intensityTechnique,
          supersetGroupId: null,
        }
      : exercise
  );
}

export function pairExercisesAsSuperset<T extends IntensityConfiguredExercise>(
  exercises: T[],
  firstExerciseId: string,
  secondExerciseId: string,
  supersetGroupId: string
): T[] {
  if (firstExerciseId === secondExerciseId) {
    return exercises;
  }

  const firstDetached = clearSupersetPair(exercises, firstExerciseId);
  const secondDetached = clearSupersetPair(firstDetached, secondExerciseId);

  return secondDetached.map((exercise) => {
    if (exercise.id !== firstExerciseId && exercise.id !== secondExerciseId) {
      return exercise;
    }

    return {
      ...exercise,
      intensityTechnique: "super-set",
      supersetGroupId,
    };
  });
}

export function unpairSupersetExercise<T extends IntensityConfiguredExercise>(
  exercises: T[],
  exerciseId: string
): T[] {
  return clearSupersetPair(exercises, exerciseId).map((exercise) =>
    exercise.id === exerciseId
      ? {
          ...exercise,
          intensityTechnique: "super-set",
          supersetGroupId: null,
        }
      : exercise
  );
}

export function removeExerciseWithIntensityCleanup<T extends IntensityConfiguredExercise>(
  exercises: T[],
  exerciseId: string
): T[] {
  return clearSupersetPair(exercises, exerciseId).filter((exercise) => exercise.id !== exerciseId);
}

export function getSupersetPartnerId<T extends IntensityConfiguredExercise>(
  exercises: T[],
  exerciseId: string
): string | null {
  const currentExercise = exercises.find((exercise) => exercise.id === exerciseId);
  const supersetGroupId = currentExercise?.supersetGroupId ?? null;

  if (!supersetGroupId) {
    return null;
  }

  return (
    exercises.find(
      (exercise) => exercise.id !== exerciseId && exercise.supersetGroupId === supersetGroupId
    )?.id ?? null
  );
}

export function getSupersetDisplayLabels<T extends IntensityConfiguredExercise>(
  exercises: T[]
): Record<string, string> {
  const labels: Record<string, string> = {};
  let supersetIndex = 1;

  exercises.forEach((exercise) => {
    if (exercise.intensityTechnique !== "super-set" || !exercise.supersetGroupId) {
      return;
    }

    if (!labels[exercise.supersetGroupId]) {
      labels[exercise.supersetGroupId] = `Superset ${supersetIndex}`;
      supersetIndex++;
    }
  });

  return labels;
}
