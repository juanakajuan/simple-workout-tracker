import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CirclePlay, Pencil, Plus, Check, X, Play } from "lucide-react";

import type {
  Exercise,
  IntensityTechnique,
  TemplateExercise,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
  Settings,
} from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  STORAGE_KEYS,
  generateId,
  DEFAULT_EXERCISES,
  normalizeTemplates,
  normalizeActiveWorkout,
} from "../utils/storage";

import { PageHeader } from "../components/PageHeader";
import { WorkoutTimer } from "../components/WorkoutTimer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  getSupersetDisplayLabels,
  pairExercisesAsSuperset,
  removeExerciseWithIntensityCleanup,
  setExerciseIntensityTechnique,
  unpairSupersetExercise,
} from "../utils/intensityTechniques";
import { WorkoutExerciseCard } from "./workout/WorkoutExerciseCard";
import {
  areAllWorkoutSetsCompleted,
  buildTemplateMuscleGroups,
  createEmptyWorkout,
  flattenTemplateExercises,
  formatWorkoutDate,
  getLastPerformedSetsByExerciseId,
  getReplacementExercises,
  mergeAvailableExercises,
  swapItems,
  type LastPerformedSet,
  type PlateCalculatorSelections,
  type WorkoutPageSelectorState,
} from "./workout/workoutPageHelpers";

import "./WorkoutPage.css";

type WorkoutExerciseSelectorNavigationState = {
  exercises: Exercise[];
  isReplacement: boolean;
  hideFilter?: boolean;
  currentExerciseId?: string;
  replacementWorkoutExerciseId?: string;
  templateUpdateChecked: boolean;
};

export function WorkoutPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, [], {
    deserialize: normalizeTemplates,
  });
  const [activeWorkout, setActiveWorkout] = useLocalStorage<Workout | null>(
    STORAGE_KEYS.ACTIVE_WORKOUT,
    null,
    { deserialize: normalizeActiveWorkout }
  );
  const [settings] = useLocalStorage<Settings>(STORAGE_KEYS.SETTINGS, {
    autoMatchWeight: false,
  });
  const [workoutName, setWorkoutName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [openKebabMenu, setOpenKebabMenu] = useState<string | null>(null);
  const [openIntensityEditorId, setOpenIntensityEditorId] = useState<string | null>(null);
  const [openPlateCalculatorId, setOpenPlateCalculatorId] = useState<string | null>(null);
  const [plateCalculatorSelections, setPlateCalculatorSelections] =
    useState<PlateCalculatorSelections>({});
  const [updateTemplateOnReplace, setUpdateTemplateOnReplace] = useState(true);
  const [updateTemplateOnAdd, setUpdateTemplateOnAdd] = useState(true);
  const { showConfirm, dialogProps } = useConfirmDialog();

  const allExercises = useMemo<Exercise[]>(
    () => mergeAvailableExercises(DEFAULT_EXERCISES, exercises),
    [exercises]
  );
  const exercisesById = useMemo<ReadonlyMap<string, Exercise>>(
    () => new Map(allExercises.map((exercise) => [exercise.id, exercise])),
    [allExercises]
  );

  /**
   * Creates and initializes a new empty workout using the shared default naming logic.
   */
  const startEmptyWorkout = (): void => {
    const newWorkout = createEmptyWorkout();
    setActiveWorkout(newWorkout);
    setWorkoutName(newWorkout.name);
  };

  /**
   * Adds an exercise to the active workout with one initial empty set.
   *
   * @param exerciseId - The unique identifier of the exercise to add
   */
  const addExerciseToWorkout = (exerciseId: string) => {
    if (!activeWorkout) return;

    const workoutExercise: WorkoutExercise = {
      id: generateId(),
      exerciseId,
      sets: [{ id: generateId(), weight: 0, reps: 0, completed: false }],
      intensityTechnique: null,
      supersetGroupId: null,
    };

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, workoutExercise],
    });
  };

  const updateFlattenedTemplateExercises = (
    templateId: string,
    updater: (templateExercises: TemplateExercise[]) => TemplateExercise[]
  ): void => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    const updatedTemplateExercises = updater(flattenTemplateExercises(template));

    setTemplates(
      templates.map((item) =>
        item.id === templateId
          ? {
              ...item,
              muscleGroups: buildTemplateMuscleGroups(updatedTemplateExercises, exercisesById),
            }
          : item
      )
    );
  };

  const moveTemplateExercise = (templateId: string, fromIndex: number, toIndex: number) => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) => {
      if (fromIndex < 0 || toIndex < 0) return templateExercises;
      if (fromIndex >= templateExercises.length || toIndex >= templateExercises.length) {
        return templateExercises;
      }

      return swapItems(templateExercises, fromIndex, toIndex);
    });
  };

  const moveWorkoutExercise = (workoutExerciseId: string, direction: "up" | "down") => {
    if (!activeWorkout) return;

    const currentIndex = activeWorkout.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId
    );
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= activeWorkout.exercises.length) return;

    setActiveWorkout({
      ...activeWorkout,
      exercises: swapItems(activeWorkout.exercises, currentIndex, newIndex),
    });

    if (activeWorkout.templateId) {
      moveTemplateExercise(activeWorkout.templateId, currentIndex, newIndex);
    }

    setOpenKebabMenu(null);
  };

  /**
   * Removes an exercise from the active workout.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise to remove
   */
  const removeExerciseFromWorkout = (workoutExerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: removeExerciseWithIntensityCleanup(activeWorkout.exercises, workoutExerciseId),
    });
  };

  /**
   * Updates the set count for a specific exercise in a template. Used to keep
   * templates in sync when sets are added or removed during a workout.
   *
   * @param templateId - The unique identifier of the template
   * @param exercisePositionInWorkout - The zero-based position of the exercise in the workout
   * @param newSetCount - The new number of sets for the exercise
   */
  const updateTemplateSetCount = (
    templateId: string,
    exercisePositionInWorkout: number,
    newSetCount: number
  ): void => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) =>
      templateExercises.map((exercise, exerciseIndex) =>
        exerciseIndex === exercisePositionInWorkout
          ? { ...exercise, setCount: newSetCount }
          : exercise
      )
    );
  };

  /**
   * Keeps the template set count aligned with the current workout exercise.
   *
   * @param updatedWorkout - The workout state after the set change
   * @param workoutExerciseId - The unique identifier of the updated workout exercise
   */
  const syncTemplateSetCountForWorkoutExercise = (
    updatedWorkout: Workout,
    workoutExerciseId: string
  ): void => {
    if (!updatedWorkout.templateId) return;

    const workoutExerciseIndex = updatedWorkout.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId
    );
    if (workoutExerciseIndex === -1) return;

    updateTemplateSetCount(
      updatedWorkout.templateId,
      workoutExerciseIndex,
      updatedWorkout.exercises[workoutExerciseIndex].sets.length
    );
  };

  /**
   * Adds a new set to an exercise in the active workout. The new set inherits
   * weight and reps from the last set. If the workout is from a template, updates
   * the template set count as well.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise
   */
  const addSet = (workoutExerciseId: string) => {
    if (!activeWorkout) return;

    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: generateId(),
              weight: lastSet?.weight ?? 0,
              reps: lastSet?.reps ?? 0,
              completed: false,
            },
          ],
        };
      }),
    };

    setActiveWorkout(updatedWorkout);
    syncTemplateSetCountForWorkoutExercise(updatedWorkout, workoutExerciseId);
  };

  /**
   * Updates a specific set within a workout exercise. If auto-match weight is
   * enabled and weight is being updated, applies the weight change to all sets
   * in the exercise.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise
   * @param setId - The unique identifier of the set to update
   * @param updates - Partial set data to update (weight, reps, or completed)
   */
  const updateSet = (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    if (!activeWorkout) return;

    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;

        // Apply auto-match weight if enabled and weight is being updated
        if (settings.autoMatchWeight && updates.weight !== undefined) {
          return {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId
                ? { ...set, ...updates }
                : { ...set, weight: updates.weight as number }
            ),
          };
        }

        // Normal behavior: only update the specific set
        return {
          ...exercise,
          sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...updates } : set)),
        };
      }),
    });
  };

  /**
   * Removes a set from a workout exercise. If the workout is from a template,
   * updates the template set count as well.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise
   * @param setId - The unique identifier of the set to remove
   */
  const removeSet = (workoutExerciseId: string, setId: string) => {
    if (!activeWorkout) return;

    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        return { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) };
      }),
    };

    setActiveWorkout(updatedWorkout);
    syncTemplateSetCountForWorkoutExercise(updatedWorkout, workoutExerciseId);
  };

  const startEditingWorkoutName = () => {
    if (!activeWorkout) return;
    setWorkoutName(activeWorkout.name);
    setIsEditingName(true);
  };

  const saveWorkoutName = () => {
    if (!activeWorkout) return;

    const trimmedName = workoutName.trim();

    if (!trimmedName) {
      setWorkoutName(activeWorkout.name);
      setIsEditingName(false);
      return;
    }

    if (trimmedName !== activeWorkout.name) {
      setActiveWorkout({
        ...activeWorkout,
        name: trimmedName,
      });
    }

    setWorkoutName(trimmedName);
    setIsEditingName(false);
  };

  /**
   * Completes the active workout by calculating duration, marking it as completed,
   * and saving it to workout history. Clears the active workout state.
   */
  const finishWorkout = () => {
    if (!activeWorkout) return;

    const now = new Date();
    const startTime = new Date(activeWorkout.startTime);
    const durationInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const completedAt = now.toISOString();

    const completedWorkout: Workout = {
      ...activeWorkout,
      name: workoutName || activeWorkout.name,
      date: completedAt,
      duration: durationInSeconds,
      completed: true,
    };

    setWorkouts([completedWorkout, ...workouts]);
    setActiveWorkout(null);
    setWorkoutName("");
  };

  /**
   * Cancels the active workout after user confirmation. All workout progress
   * is discarded without saving to history.
   */
  const cancelWorkout = () => {
    showConfirm({
      title: "Cancel this workout?",
      message: "All progress will be lost.",
      confirmText: "Yes Papi",
      cancelText: "No",
      variant: "danger",
      onConfirm: () => {
        setActiveWorkout(null);
        setWorkoutName("");
      },
    });
  };

  /**
   * Updates the notes for an exercise. For user exercises, updates the existing
   * exercise. For default exercises, creates an override with the new notes.
   *
   * @param exerciseId - The unique identifier of the exercise
   * @param noteText - The new note text to save
   */
  const updateExerciseNote = (exerciseId: string, noteText: string): void => {
    const existingExercise = exercises.find((exercise) => exercise.id === exerciseId);

    if (existingExercise) {
      const updatedExercises = exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, notes: noteText } : exercise
      );
      setExercises(updatedExercises);
    } else {
      const defaultExercise = DEFAULT_EXERCISES.find((exercise) => exercise.id === exerciseId);
      if (defaultExercise) {
        setExercises([...exercises, { ...defaultExercise, notes: noteText }]);
      }
    }
  };

  /**
   * Opens the note editor for a workout exercise and closes any open kebab menu.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise
   */
  const addNoteToExercise = (workoutExerciseId: string): void => {
    setEditingNoteId(workoutExerciseId);
    setOpenKebabMenu(null);
  };

  /**
   * Replaces an exercise in the workout with a new exercise. Preserves the number
   * of sets but resets weight, reps, and completion status. Optionally updates
   * the template if the workout is from a template.
   *
   * @param newExerciseId - The unique identifier of the replacement exercise
   */
  const replaceExerciseInWorkout = (
    workoutExerciseId: string,
    newExerciseId: string,
    shouldUpdateTemplate: boolean
  ) => {
    if (!activeWorkout) return;

    const workoutExerciseIndex = activeWorkout.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId
    );

    if (workoutExerciseIndex === -1) return;

    const oldWorkoutExercise = activeWorkout.exercises[workoutExerciseIndex];

    const newSets = oldWorkoutExercise.sets.map((set) => ({
      ...set,
      weight: 0,
      reps: 0,
      completed: false,
    }));

    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise) =>
        exercise.id === workoutExerciseId
          ? { ...exercise, exerciseId: newExerciseId, sets: newSets }
          : exercise
      ),
    };

    setActiveWorkout(updatedWorkout);

    if (shouldUpdateTemplate && activeWorkout.templateId) {
      updateTemplateExercise(activeWorkout.templateId, workoutExerciseIndex, newExerciseId);
    }
  };

  /**
   * Updates a specific exercise in a template to use a different exercise.
   * Used when replacing an exercise during a workout and the user opts to
   * update the template as well.
   *
   * @param templateId - The unique identifier of the template
   * @param exercisePositionInWorkout - The zero-based position of the exercise in the workout
   * @param newExerciseId - The unique identifier of the new exercise
   */
  const updateTemplateExercise = (
    templateId: string,
    exercisePositionInWorkout: number,
    newExerciseId: string
  ) => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) =>
      templateExercises.map((exercise, exerciseIndex) =>
        exerciseIndex === exercisePositionInWorkout
          ? { ...exercise, exerciseId: newExerciseId }
          : exercise
      )
    );
  };

  /**
   * Removes a specific exercise from a template. Used when deleting an exercise
   * from a workout and the user opts to update the template as well. If the
   * muscle group becomes empty after removal, the entire muscle group is removed.
   *
   * @param templateId - The unique identifier of the template
   * @param exercisePositionInWorkout - The zero-based position of the exercise in the workout
   */
  const removeExerciseFromTemplate = (templateId: string, exercisePositionInWorkout: number) => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) => {
      const targetExercise = templateExercises[exercisePositionInWorkout];
      if (!targetExercise) {
        return templateExercises;
      }

      return removeExerciseWithIntensityCleanup(templateExercises, targetExercise.id);
    });
  };

  /**
   * Adds a new exercise to a template at the same flat position used in the
   * active workout so grouped muscle sections stay in the same order.
   *
   * @param templateId - The unique identifier of the template
   * @param exercise - The exercise to add to the template
   * @param exercisePositionInWorkout - The zero-based workout insertion position
   */
  const addExerciseToTemplate = (
    templateId: string,
    exercise: Exercise,
    exercisePositionInWorkout: number
  ) => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) => {
      const insertionIndex = Math.min(
        Math.max(exercisePositionInWorkout, 0),
        templateExercises.length
      );
      const insertedExercise = {
        id: generateId(),
        exerciseId: exercise.id,
        setCount: 3,
        intensityTechnique: null,
        supersetGroupId: null,
      };
      const nextExercises = [...templateExercises];

      nextExercises.splice(insertionIndex, 0, insertedExercise);

      return nextExercises;
    });
  };

  const updateTemplateExerciseIntensity = (
    templateId: string,
    exercisePositionInWorkout: number,
    intensityTechnique: IntensityTechnique | null
  ) => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) => {
      const targetExercise = templateExercises[exercisePositionInWorkout];
      if (!targetExercise) {
        return templateExercises;
      }

      return setExerciseIntensityTechnique(
        templateExercises,
        targetExercise.id,
        intensityTechnique
      );
    });
  };

  const pairTemplateSuperset = (
    templateId: string,
    firstExercisePosition: number,
    secondExercisePosition: number,
    supersetGroupId: string
  ) => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) => {
      const firstExercise = templateExercises[firstExercisePosition];
      const secondExercise = templateExercises[secondExercisePosition];

      if (!firstExercise || !secondExercise) {
        return templateExercises;
      }

      return pairExercisesAsSuperset(
        templateExercises,
        firstExercise.id,
        secondExercise.id,
        supersetGroupId
      );
    });
  };

  const unpairTemplateSuperset = (templateId: string, exercisePositionInWorkout: number) => {
    updateFlattenedTemplateExercises(templateId, (templateExercises) => {
      const targetExercise = templateExercises[exercisePositionInWorkout];
      if (!targetExercise) {
        return templateExercises;
      }

      return unpairSupersetExercise(templateExercises, targetExercise.id);
    });
  };

  const applyWorkoutIntensityChange = (
    applyWorkoutChange: () => void,
    applyTemplateChange?: () => void
  ) => {
    if (!activeWorkout?.templateId || !applyTemplateChange) {
      applyWorkoutChange();
      return;
    }

    showConfirm({
      title: "Apply intensity change?",
      message: "Choose whether this change should also update the template.",
      confirmText: "Apply",
      cancelText: "Cancel",
      variant: "standard",
      checkboxLabel: "Update template",
      checkboxDefaultChecked: false,
      onConfirm: (shouldUpdateTemplate) => {
        applyWorkoutChange();

        if (shouldUpdateTemplate) {
          applyTemplateChange();
        }
      },
    });
  };

  const updateWorkoutIntensityTechnique = (
    workoutExerciseId: string,
    intensityTechnique: IntensityTechnique | null
  ) => {
    if (!activeWorkout) return;

    const workoutExerciseIndex = activeWorkout.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId
    );
    if (workoutExerciseIndex === -1) return;

    applyWorkoutIntensityChange(
      () => {
        setActiveWorkout({
          ...activeWorkout,
          exercises: setExerciseIntensityTechnique(
            activeWorkout.exercises,
            workoutExerciseId,
            intensityTechnique
          ),
        });
      },
      activeWorkout.templateId
        ? () =>
            updateTemplateExerciseIntensity(
              activeWorkout.templateId!,
              workoutExerciseIndex,
              intensityTechnique
            )
        : undefined
    );
  };

  const updateWorkoutSupersetPair = (
    workoutExerciseId: string,
    partnerWorkoutExerciseId: string
  ) => {
    if (!activeWorkout) return;

    const workoutExerciseIndex = activeWorkout.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId
    );
    if (workoutExerciseIndex === -1) return;

    if (!partnerWorkoutExerciseId) {
      applyWorkoutIntensityChange(
        () => {
          setActiveWorkout({
            ...activeWorkout,
            exercises: unpairSupersetExercise(activeWorkout.exercises, workoutExerciseId),
          });
        },
        activeWorkout.templateId
          ? () => unpairTemplateSuperset(activeWorkout.templateId!, workoutExerciseIndex)
          : undefined
      );
      return;
    }

    const partnerExercise = activeWorkout.exercises.find(
      (exercise) => exercise.id === partnerWorkoutExerciseId
    );
    const partnerExerciseIndex = activeWorkout.exercises.findIndex(
      (exercise) => exercise.id === partnerWorkoutExerciseId
    );

    if (!partnerExercise || partnerExerciseIndex === -1) {
      return;
    }

    const currentExercise = activeWorkout.exercises[workoutExerciseIndex];
    const supersetGroupId =
      currentExercise.supersetGroupId ?? partnerExercise.supersetGroupId ?? generateId();

    applyWorkoutIntensityChange(
      () => {
        setActiveWorkout({
          ...activeWorkout,
          exercises: pairExercisesAsSuperset(
            activeWorkout.exercises,
            workoutExerciseId,
            partnerWorkoutExerciseId,
            supersetGroupId
          ),
        });
      },
      activeWorkout.templateId
        ? () =>
            pairTemplateSuperset(
              activeWorkout.templateId!,
              workoutExerciseIndex,
              partnerExerciseIndex,
              supersetGroupId
            )
        : undefined
    );
  };

  /**
   * Deletes the notes from an exercise by setting them to an empty string.
   * Closes any open kebab menu.
   *
   * @param exerciseId - The unique identifier of the exercise
   */
  const deleteNoteFromExercise = (exerciseId: string): void => {
    const existingExercise = exercises.find((exercise) => exercise.id === exerciseId);

    if (existingExercise) {
      const updatedExercises = exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, notes: "" } : exercise
      );
      setExercises(updatedExercises);
    }

    setOpenKebabMenu(null);
  };

  /**
   * Marks all incomplete sets of an exercise as skipped.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise
   */
  const skipRemainingSets = (workoutExerciseId: string): void => {
    if (!activeWorkout) return;

    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;

        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            !set.completed && !set.skipped ? { ...set, skipped: true } : set
          ),
        };
      }),
    });
  };

  /** Closes the transient per-exercise action menus. */
  const closeExerciseActionMenus = (): void => {
    setOpenKebabMenu(null);
    setOpenIntensityEditorId(null);
  };

  /**
   * Closes any open kebab menu when clicking outside of the menu area.
   *
   * @param event - The mouse event
   */
  const handleClickOutside = (event: React.MouseEvent): void => {
    if ((event.target as HTMLElement).closest(".kebab-menu")) return;
    if ((event.target as HTMLElement).closest(".workout-exercise-actions")) return;
    if ((event.target as HTMLElement).closest(".workout-technique-editor")) return;
    closeExerciseActionMenus();
  };

  /** Opens or closes the kebab menu for a workout exercise. */
  const toggleKebabMenu = (workoutExerciseId: string): void => {
    setOpenKebabMenu((current) => (current === workoutExerciseId ? null : workoutExerciseId));
    setOpenIntensityEditorId(null);
  };

  /** Opens or closes the intensity editor for a workout exercise. */
  const toggleIntensityEditor = (workoutExerciseId: string): void => {
    setOpenIntensityEditorId((current) => (current === workoutExerciseId ? null : workoutExerciseId));
    setOpenKebabMenu(null);
  };

  /** Opens or closes the plate calculator for a workout exercise. */
  const togglePlateCalculator = (workoutExerciseId: string, defaultSetId?: string): void => {
    if (openPlateCalculatorId !== workoutExerciseId && defaultSetId) {
      setPlateCalculatorSelections((previous) => ({
        ...previous,
        [workoutExerciseId]: previous[workoutExerciseId] ?? defaultSetId,
      }));
    }

    setOpenPlateCalculatorId((current) => (current === workoutExerciseId ? null : workoutExerciseId));
    closeExerciseActionMenus();
  };

  /** Stores the chosen plate-calculator set for a workout exercise. */
  const selectPlateCalculatorSet = (workoutExerciseId: string, setId: string): void => {
    setPlateCalculatorSelections((previous) => ({
      ...previous,
      [workoutExerciseId]: setId,
    }));
  };

  /** Navigates to the workout exercise selector with shared template flags. */
  const openExerciseSelector = (state: WorkoutExerciseSelectorNavigationState): void => {
    navigate("/workout/select-exercise", {
      state: {
        ...state,
        isTemplateWorkout: Boolean(activeWorkout?.templateId),
        showTemplateUpdate: Boolean(activeWorkout?.templateId),
      },
    });
  };

  /**
   * Opens the exercise selector for adding a new exercise to the workout.
   */
  const handleAddExercise = (): void => {
    openExerciseSelector({
      exercises: allExercises,
      isReplacement: false,
      templateUpdateChecked: updateTemplateOnAdd,
    });
  };

  /** Removes a workout exercise and optionally updates its template source. */
  const deleteWorkoutExercise = (workoutExerciseId: string): void => {
    if (!activeWorkout?.templateId) {
      removeExerciseFromWorkout(workoutExerciseId);
      setOpenKebabMenu(null);
      return;
    }

    const exercisePositionInWorkout = activeWorkout.exercises.findIndex(
      (exercise) => exercise.id === workoutExerciseId
    );

    showConfirm({
      title: "Delete Exercise?",
      message: "Remove this exercise from your workout.",
      confirmText: "Send it to the shadow realm",
      variant: "danger",
      checkboxLabel: "Update template",
      checkboxDefaultChecked: true,
      onConfirm: (shouldUpdateTemplate) => {
        if (shouldUpdateTemplate && exercisePositionInWorkout !== -1) {
          removeExerciseFromTemplate(activeWorkout.templateId!, exercisePositionInWorkout);
        }

        removeExerciseFromWorkout(workoutExerciseId);
      },
    });

    setOpenKebabMenu(null);
  };

  /**
   * Opens the exercise selector for replacing an exercise in the workout.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise to replace
   */
  const handleReplaceExercise = (workoutExerciseId: string): void => {
    setOpenKebabMenu(null);

    const selectedWorkoutExercise = activeWorkout?.exercises.find(
      (exercise) => exercise.id === workoutExerciseId
    );
    const currentExerciseId = selectedWorkoutExercise?.exerciseId;

    openExerciseSelector({
      exercises: getReplacementExercises(activeWorkout, allExercises, exercisesById, workoutExerciseId),
      isReplacement: true,
      hideFilter: true,
      currentExerciseId,
      replacementWorkoutExerciseId: workoutExerciseId,
      templateUpdateChecked: updateTemplateOnReplace,
    });
  };

  /**
   * Opens the exercise history view for a specific exercise.
   *
   * @param exerciseId - The unique identifier of the exercise
   */
  const handleViewHistory = (exerciseId: string): void => {
    navigate(`/workout/history/${exerciseId}`);
  };

  /**
   * Handles navigation state from exercise selector.
   */
  useEffect(() => {
    if (!location.state) return;

    const state = location.state as WorkoutPageSelectorState;

    if (state.selectedExerciseId) {
      if (state.replacementWorkoutExerciseId) {
        setUpdateTemplateOnReplace(state.updateTemplate ?? updateTemplateOnReplace);
        replaceExerciseInWorkout(
          state.replacementWorkoutExerciseId,
          state.selectedExerciseId,
          state.updateTemplate ?? updateTemplateOnReplace
        );
      } else {
        const exercisePositionInWorkout = activeWorkout?.exercises.length;
        addExerciseToWorkout(state.selectedExerciseId);
        if (
          activeWorkout?.templateId &&
          exercisePositionInWorkout !== undefined &&
          (state.updateTemplate ?? updateTemplateOnAdd)
        ) {
          const exercise = exercisesById.get(state.selectedExerciseId);
          if (exercise) {
            addExerciseToTemplate(activeWorkout.templateId, exercise, exercisePositionInWorkout);
          }
        }
        setUpdateTemplateOnAdd(true);
      }

      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const activeExerciseIdsKey =
    activeWorkout?.exercises.map((exercise) => exercise.exerciseId).join("\u0000") ?? "";
  const lastPerformedSetsByExerciseId = useMemo<Record<string, LastPerformedSet[] | null>>(
    () => getLastPerformedSetsByExerciseId(activeExerciseIdsKey, workouts),
    [activeExerciseIdsKey, workouts]
  );

  const supersetDisplayLabels = activeWorkout
    ? getSupersetDisplayLabels(activeWorkout.exercises)
    : {};

  const handleWorkoutTechniqueSelection = (
    workoutExerciseId: string,
    intensityTechnique: IntensityTechnique | null
  ): void => {
    updateWorkoutIntensityTechnique(workoutExerciseId, intensityTechnique);

    if (intensityTechnique === "super-set") {
      setOpenIntensityEditorId(workoutExerciseId);
      return;
    }

    setOpenIntensityEditorId((current) => (current === workoutExerciseId ? null : current));
  };

  // No active workout - show start screen
  if (!activeWorkout) {
    return (
      <div className="page workout-page-idle">
        <PageHeader title="Workout" showBackButton={false} />

        <div className="start-workout-section">
          <div className="start-workout-card-compact">
            <CirclePlay size={32} strokeWidth={1.5} />
            <div className="start-workout-text">
              <h2>Ready to train?</h2>
              <p>Start an empty workout</p>
            </div>
            <button className="btn btn-primary text-uppercase" onClick={startEmptyWorkout}>
              <Play size={18} />
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isWorkoutReadyToFinish = areAllWorkoutSetsCompleted(activeWorkout);

  return (
    <div className="page workout-page" onClick={handleClickOutside}>
      <header className="workout-header">
        <div className="workout-header-top">
          {isEditingName ? (
            <input
              className="workout-name-input"
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              onBlur={saveWorkoutName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveWorkoutName();
                }

                if (e.key === "Escape") {
                  setWorkoutName(activeWorkout.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h1 className="workout-name" onClick={startEditingWorkoutName}>
              {activeWorkout.name}
              <Pencil size={16} />
            </h1>
          )}
        </div>
        <p className="workout-date">{formatWorkoutDate(activeWorkout.date)}</p>
        <WorkoutTimer startTime={activeWorkout.startTime} />
      </header>

      <div className="workout-exercises">
        {activeWorkout.exercises.length === 0 ? (
          <div className="empty-exercises">
            <p>No exercises added yet. Add your first exercise to get started!</p>
          </div>
        ) : (
          activeWorkout.exercises.map((workoutExercise, exerciseIndex) => {
            const exercise = exercisesById.get(workoutExercise.exerciseId);
            if (!exercise) return null;

            return (
              <WorkoutExerciseCard
                key={workoutExercise.id}
                workoutExercise={workoutExercise}
                exercise={exercise}
                allWorkoutExercises={activeWorkout.exercises}
                exerciseLookup={exercisesById}
                exerciseIndex={exerciseIndex}
                totalExerciseCount={activeWorkout.exercises.length}
                lastPerformedSets={lastPerformedSetsByExerciseId[workoutExercise.exerciseId]}
                supersetDisplayLabels={supersetDisplayLabels}
                isKebabMenuOpen={openKebabMenu === workoutExercise.id}
                isIntensityEditorOpen={openIntensityEditorId === workoutExercise.id}
                isPlateCalculatorOpen={openPlateCalculatorId === workoutExercise.id}
                isNoteEditorOpen={editingNoteId === workoutExercise.id}
                selectedPlateCalculatorSetId={plateCalculatorSelections[workoutExercise.id]}
                onViewHistory={() => handleViewHistory(exercise.id)}
                onToggleKebabMenu={() => toggleKebabMenu(workoutExercise.id)}
                onToggleIntensityEditor={() => toggleIntensityEditor(workoutExercise.id)}
                onTogglePlateCalculator={(defaultSetId) =>
                  togglePlateCalculator(workoutExercise.id, defaultSetId)
                }
                onSelectPlateCalculatorSet={(setId) =>
                  selectPlateCalculatorSet(workoutExercise.id, setId)
                }
                onStartEditingNote={() => addNoteToExercise(workoutExercise.id)}
                onStopEditingNote={() => setEditingNoteId(null)}
                onChangeNote={(noteText) => updateExerciseNote(exercise.id, noteText)}
                onDeleteNote={() => deleteNoteFromExercise(exercise.id)}
                onSkipRemainingSets={() => {
                  skipRemainingSets(workoutExercise.id);
                  setOpenKebabMenu(null);
                }}
                onMoveExercise={(direction) => moveWorkoutExercise(workoutExercise.id, direction)}
                onReplaceExercise={() => handleReplaceExercise(workoutExercise.id)}
                onDeleteExercise={() => deleteWorkoutExercise(workoutExercise.id)}
                onSetIntensityTechnique={(intensityTechnique) =>
                  handleWorkoutTechniqueSelection(workoutExercise.id, intensityTechnique)
                }
                onSetSupersetPartner={(partnerWorkoutExerciseId) => {
                  updateWorkoutSupersetPair(workoutExercise.id, partnerWorkoutExerciseId);
                  setOpenIntensityEditorId(null);
                }}
                onUpdateSet={(setId, updates) => updateSet(workoutExercise.id, setId, updates)}
                onRemoveSet={(setId) => removeSet(workoutExercise.id, setId)}
                onAddSet={() => addSet(workoutExercise.id)}
              />
            );
          })
        )}
      </div>

      <div className="workout-actions">
        <button className="btn btn-secondary add-exercise-btn" onClick={handleAddExercise}>
          <Plus size={20} />
          Add Exercise
        </button>

        <button
          className={
            isWorkoutReadyToFinish ? "btn btn-primary finish-btn" : "btn btn-secondary finish-btn"
          }
          onClick={isWorkoutReadyToFinish ? finishWorkout : cancelWorkout}
        >
          {isWorkoutReadyToFinish ? (
            <>
              <Check size={20} strokeWidth={2.5} />
              Finish Workout
            </>
          ) : (
            <>
              <X size={20} />
              Cancel Workout
            </>
          )}
        </button>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
