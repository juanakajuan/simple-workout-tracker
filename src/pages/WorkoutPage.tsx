import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CirclePlay,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Play,
  Edit3,
  MoreVertical,
  StickyNote,
  ArrowLeftRight,
  SkipForward,
} from "lucide-react";

import type {
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
  Settings,
} from "../types";
import { muscleGroupLabels, exerciseTypeLabels, getMuscleGroupClassName } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  STORAGE_KEYS,
  generateId,
  DEFAULT_EXERCISES,
  getLastPerformedSets,
  normalizeTemplates,
  normalizeActiveWorkout,
} from "../utils/storage";

import { SetRow } from "../components/SetRow";
import { WorkoutTimer } from "../components/WorkoutTimer";
import { ConfirmDialog } from "../components/ConfirmDialog";

import "./WorkoutPage.css";

export function WorkoutPage() {
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
  const [replacingWorkoutExerciseId, setReplacingWorkoutExerciseId] = useState<string | null>(null);
  const [updateTemplateOnReplace, setUpdateTemplateOnReplace] = useState(true);
  const [updateTemplateOnAdd, setUpdateTemplateOnAdd] = useState(true);
  const { showConfirm, dialogProps } = useConfirmDialog();

  // Merge default exercises with user exercises, user exercises override defaults
  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = exercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(exercises.filter((exercise) => !exercise.id.startsWith("default-")));

  /**
   * Creates and initializes a new empty workout with a default name based on the
   * current day of the week (e.g., "Monday Workout").
   */
  const startEmptyWorkout = () => {
    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const defaultName = `${dayNames[today.getDay()]} Workout`;

    const newWorkout: Workout = {
      id: generateId(),
      name: defaultName,
      date: today.toISOString(),
      startTime: today.toISOString(),
      exercises: [],
      completed: false,
    };
    setActiveWorkout(newWorkout);
    setWorkoutName(defaultName);
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
    };

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, workoutExercise],
    });
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
      exercises: activeWorkout.exercises.filter((exercise) => exercise.id !== workoutExerciseId),
    });
  };

  const getTemplateExerciseLocation = (
    template: WorkoutTemplate,
    exercisePositionInWorkout: number
  ) => {
    let currentPosition = 0;

    for (const muscleGroup of template.muscleGroups) {
      for (const exercise of muscleGroup.exercises) {
        if (currentPosition === exercisePositionInWorkout) {
          return {
            muscleGroupId: muscleGroup.id,
            exerciseId: exercise.id,
          };
        }
        currentPosition++;
      }
    }

    return null;
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
  ) => {
    const template = templates.find((template) => template.id === templateId);
    if (!template) return;

    const target = getTemplateExerciseLocation(template, exercisePositionInWorkout);
    if (!target) return;

    const updatedTemplates = templates.map((template) => {
      if (template.id !== templateId) return template;

      return {
        ...template,
        muscleGroups: template.muscleGroups.map((muscleGroup) => {
          if (muscleGroup.id !== target.muscleGroupId) return muscleGroup;

          return {
            ...muscleGroup,
            exercises: muscleGroup.exercises.map((exercise) => {
              if (exercise.id !== target.exerciseId) return exercise;
              return { ...exercise, setCount: newSetCount };
            }),
          };
        }),
      };
    });

    setTemplates(updatedTemplates);
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

    // Update template if this workout is from a template
    if (activeWorkout.templateId) {
      const workoutExerciseIndex = activeWorkout.exercises.findIndex(
        (exercise) => exercise.id === workoutExerciseId
      );
      if (workoutExerciseIndex !== -1) {
        const updatedExercise = updatedWorkout.exercises[workoutExerciseIndex];
        updateTemplateSetCount(
          activeWorkout.templateId,
          workoutExerciseIndex,
          updatedExercise.sets.length
        );
      }
    }
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

    // Update template if this workout is from a template
    if (activeWorkout.templateId) {
      const workoutExerciseIndex = activeWorkout.exercises.findIndex(
        (exercise) => exercise.id === workoutExerciseId
      );
      if (workoutExerciseIndex !== -1) {
        const updatedExercise = updatedWorkout.exercises[workoutExerciseIndex];
        updateTemplateSetCount(
          activeWorkout.templateId,
          workoutExerciseIndex,
          updatedExercise.sets.length
        );
      }
    }
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

    const completedWorkout: Workout = {
      ...activeWorkout,
      name: workoutName || activeWorkout.name,
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
   * Retrieves an exercise by its unique identifier from the merged list of
   * default and user exercises.
   *
   * @param id - The unique identifier of the exercise
   * @returns The exercise if found, undefined otherwise
   */
  const getExerciseById = (id: string) => allExercises.find((exercise) => exercise.id === id);

  /**
   * Gets the muscle group of the exercise currently being replaced. Used to filter
   * replacement exercise options to the same muscle group.
   *
   * @returns The muscle group of the exercise being replaced, or undefined
   */
  const getReplacementMuscleGroup = () => {
    if (!replacingWorkoutExerciseId || !activeWorkout) return undefined;

    const workoutExercise = activeWorkout.exercises.find(
      (exercise) => exercise.id === replacingWorkoutExerciseId
    );
    if (!workoutExercise) return undefined;

    const exercise = getExerciseById(workoutExercise.exerciseId);
    return exercise?.muscleGroup;
  };

  /**
   * Gets the list of exercises available for replacement. Filters to only show
   * exercises from the same muscle group as the exercise being replaced.
   *
   * @returns Filtered list of exercises for replacement, or all exercises if no filter applies
   */
  const getReplacementExercises = () => {
    const muscleGroup = getReplacementMuscleGroup();
    if (!muscleGroup) return allExercises;

    return allExercises.filter((exercise) => exercise.muscleGroup === muscleGroup);
  };

  /**
   * Updates the notes for an exercise. For user exercises, updates the existing
   * exercise. For default exercises, creates an override with the new notes.
   *
   * @param exerciseId - The unique identifier of the exercise
   * @param noteText - The new note text to save
   */
  const updateExerciseNote = (exerciseId: string, noteText: string) => {
    // Update in user exercises (will create override for default exercises)
    const existingExercise = exercises.find((exercise) => exercise.id === exerciseId);

    if (existingExercise) {
      // Update existing user exercise
      const updatedExercises = exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, notes: noteText } : exercise
      );
      setExercises(updatedExercises);
    } else {
      // Create override for default exercise
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
  const addNoteToExercise = (workoutExerciseId: string) => {
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
  const replaceExerciseInWorkout = (newExerciseId: string) => {
    if (!activeWorkout || !replacingWorkoutExerciseId) return;

    const workoutExerciseIndex = activeWorkout.exercises.findIndex(
      (exercise) => exercise.id === replacingWorkoutExerciseId
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
        exercise.id === replacingWorkoutExerciseId
          ? { ...exercise, exerciseId: newExerciseId, sets: newSets }
          : exercise
      ),
    };

    setActiveWorkout(updatedWorkout);

    if (updateTemplateOnReplace && activeWorkout.templateId) {
      updateTemplateExercise(activeWorkout.templateId, workoutExerciseIndex, newExerciseId);
    }

    setReplacingWorkoutExerciseId(null);
    setUpdateTemplateOnReplace(false);
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
    const template = templates.find((template) => template.id === templateId);
    if (!template) return;

    const target = getTemplateExerciseLocation(template, exercisePositionInWorkout);
    if (!target) return;

    const updatedTemplates = templates.map((template) => {
      if (template.id !== templateId) return template;

      return {
        ...template,
        muscleGroups: template.muscleGroups.map((muscleGroup) => {
          if (muscleGroup.id !== target.muscleGroupId) return muscleGroup;

          return {
            ...muscleGroup,
            exercises: muscleGroup.exercises.map((exercise) => {
              if (exercise.id !== target.exerciseId) return exercise;
              return { ...exercise, exerciseId: newExerciseId };
            }),
          };
        }),
      };
    });

    setTemplates(updatedTemplates);
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
    const template = templates.find((template) => template.id === templateId);
    if (!template) return;

    const target = getTemplateExerciseLocation(template, exercisePositionInWorkout);
    if (!target) return;

    const updatedTemplates = templates.map((template) => {
      if (template.id !== templateId) return template;

      return {
        ...template,
        muscleGroups: template.muscleGroups
          .map((muscleGroup) => {
            if (muscleGroup.id !== target.muscleGroupId) return muscleGroup;

            return {
              ...muscleGroup,
              exercises: muscleGroup.exercises.filter(
                (exercise) => exercise.id !== target.exerciseId
              ),
            };
          })
          .filter((muscleGroup) => muscleGroup.exercises.length > 0),
      };
    });

    setTemplates(updatedTemplates);
  };

  /**
   * Adds a new exercise to a template. Used when adding an exercise to a workout
   * and the user opts to update the template as well. The exercise is added to
   * an existing muscle group that matches the exercise's muscle group, or a new
   * muscle group is created if none exists.
   *
   * @param templateId - The unique identifier of the template
   * @param exercise - The exercise to add to the template
   */
  const addExerciseToTemplate = (templateId: string, exercise: Exercise) => {
    const template = templates.find((template) => template.id === templateId);
    if (!template) return;

    const updatedTemplates = templates.map((template) => {
      if (template.id !== templateId) return template;

      const existingMuscleGroup = template.muscleGroups.find(
        (muscleGroup) => muscleGroup.muscleGroup === exercise.muscleGroup
      );

      if (existingMuscleGroup) {
        return {
          ...template,
          muscleGroups: template.muscleGroups.map((muscleGroup) => {
            if (muscleGroup.id !== existingMuscleGroup.id) return muscleGroup;

            return {
              ...muscleGroup,
              exercises: [
                ...muscleGroup.exercises,
                {
                  id: generateId(),
                  exerciseId: exercise.id,
                  setCount: 3,
                },
              ],
            };
          }),
        };
      }

      return {
        ...template,
        muscleGroups: [
          ...template.muscleGroups,
          {
            id: generateId(),
            muscleGroup: exercise.muscleGroup,
            exercises: [
              {
                id: generateId(),
                exerciseId: exercise.id,
                setCount: 3,
              },
            ],
          },
        ],
      };
    });

    setTemplates(updatedTemplates);
  };

  /**
   * Deletes the notes from an exercise by setting them to an empty string.
   * Closes any open kebab menu.
   *
   * @param exerciseId - The unique identifier of the exercise
   */
  const deleteNoteFromExercise = (exerciseId: string) => {
    // Update exercise notes to empty
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
   * Checks whether an exercise has notes.
   *
   * @param exercise - The exercise to check
   * @returns True if the exercise has non-empty notes, false otherwise
   */
  const hasNote = (exercise: Exercise): boolean => {
    return !!exercise.notes;
  };

  /**
   * Checks if all sets in the active workout have been completed or skipped.
   *
   * @returns True if all sets are completed or skipped (and workout has exercises), false otherwise
   */
  const allSetsCompleted = () => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return false;
    return activeWorkout.exercises.every((workoutExercise) =>
      workoutExercise.sets.every((set) => set.completed || set.skipped)
    );
  };

  /**
   * Marks all incomplete sets of an exercise as skipped.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise
   */
  const skipRemainingSets = (workoutExerciseId: string) => {
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

  /**
   * Closes any open kebab menu when clicking outside of the menu area.
   *
   * @param event - The mouse event
   */
  const handleClickOutside = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest(".kebab-menu")) return;
    if ((event.target as HTMLElement).closest(".workout-exercise-actions")) return;
    setOpenKebabMenu(null);
  };

  /**
   * Opens the exercise selector for adding a new exercise to the workout.
   */
  const handleAddExercise = () => {
    navigate("/workout/select-exercise", {
      state: {
        exercises: allExercises,
        isReplacement: false,
        isTemplateWorkout: !!activeWorkout?.templateId,
        showTemplateUpdate: !!activeWorkout?.templateId,
        templateUpdateChecked: updateTemplateOnAdd,
      },
    });
  };

  /**
   * Opens the exercise selector for replacing an exercise in the workout.
   *
   * @param workoutExerciseId - The unique identifier of the workout exercise to replace
   */
  const handleReplaceExercise = (workoutExerciseId: string) => {
    setReplacingWorkoutExerciseId(workoutExerciseId);
    setOpenKebabMenu(null);

    const workoutExercise = activeWorkout?.exercises.find((e) => e.id === workoutExerciseId);
    const currentExerciseId = workoutExercise?.exerciseId;

    navigate("/workout/select-exercise", {
      state: {
        exercises: getReplacementExercises(),
        isReplacement: true,
        hideFilter: true,
        currentExerciseId,
        showTemplateUpdate: !!activeWorkout?.templateId,
        templateUpdateChecked: updateTemplateOnReplace,
      },
    });
  };

  /**
   * Opens the exercise history view for a specific exercise.
   *
   * @param exerciseId - The unique identifier of the exercise
   */
  const handleViewHistory = (exerciseId: string) => {
    navigate(`/workout/history/${exerciseId}`);
  };

  /**
   * Handles navigation state from exercise selector, day selector, and exercise creation
   */
  useEffect(() => {
    if (!location.state) return;

    const state = location.state as {
      selectedExerciseId?: string;
      selectedDay?: string;
      savedExercise?: boolean;
      exerciseId?: string;
      updateTemplate?: boolean;
    };

    // Handle exercise selection (add or replace)
    if (state.selectedExerciseId) {
      if (replacingWorkoutExerciseId) {
        replaceExerciseInWorkout(state.selectedExerciseId);
        setReplacingWorkoutExerciseId(null);
        setUpdateTemplateOnReplace(true);
      } else {
        addExerciseToWorkout(state.selectedExerciseId);
        // Update template if workout is from template and updateTemplate flag is set
        if (activeWorkout?.templateId && (state.updateTemplate ?? updateTemplateOnAdd)) {
          const exercise = allExercises.find((e) => e.id === state.selectedExerciseId);
          if (exercise) {
            addExerciseToTemplate(activeWorkout.templateId, exercise);
          }
        }
        setUpdateTemplateOnAdd(true);
      }
      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }

    // Handle new exercise creation within selector flow
    if (state.savedExercise && state.exerciseId) {
      if (!replacingWorkoutExerciseId) {
        addExerciseToWorkout(state.exerciseId);
      }
      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // No active workout - show start screen
  if (!activeWorkout) {
    return (
      <div className="page workout-page-idle">
        <header className="page-header">
          <h1 className="page-title">Workout</h1>
        </header>

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

  // Active workout view
  return (
    <div className="page workout-page" onClick={handleClickOutside}>
      <header className="workout-header">
        <div className="workout-header-top">
          {isEditingName ? (
            <input
              className="workout-name-input"
              type="text"
              value={workoutName || activeWorkout.name}
              onChange={(e) => setWorkoutName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
              autoFocus
            />
          ) : (
            <h1 className="workout-name" onClick={() => setIsEditingName(true)}>
              {workoutName || activeWorkout.name}
              <Pencil size={16} />
            </h1>
          )}
        </div>
        <p className="workout-date">
          {new Date(activeWorkout.date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>
        <WorkoutTimer startTime={activeWorkout.startTime} />
      </header>

      <div className="workout-exercises">
        {activeWorkout.exercises.length === 0 ? (
          <div className="empty-exercises">
            <p>No exercises added yet. Add your first exercise to get started!</p>
          </div>
        ) : (
          activeWorkout.exercises.map((workoutExercise) => {
            const exercise = getExerciseById(workoutExercise.exerciseId);
            if (!exercise) return null;

            return (
              <div key={workoutExercise.id} className="workout-exercise-card card">
                <div className="workout-exercise-header">
                  <div>
                    <span className={`tag ${getMuscleGroupClassName(exercise.muscleGroup)}`}>
                      {muscleGroupLabels[exercise.muscleGroup]}
                    </span>
                    <div className="exercise-name-row">
                      <h3
                        className="workout-exercise-name clickable"
                        onClick={() => handleViewHistory(exercise.id)}
                      >
                        {exercise.name}
                      </h3>
                      <span className="tag tag-muted">
                        {exerciseTypeLabels[exercise.exerciseType]}
                      </span>
                    </div>
                  </div>
                  <div className="workout-exercise-actions">
                    <button
                      className="btn btn-icon btn-ghost"
                      onClick={() =>
                        setOpenKebabMenu(
                          openKebabMenu === workoutExercise.id ? null : workoutExercise.id
                        )
                      }
                      aria-label="More options"
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openKebabMenu === workoutExercise.id && (
                      <div className="kebab-menu">
                        {hasNote(exercise) ? (
                          <button
                            className="kebab-menu-item"
                            onClick={() => deleteNoteFromExercise(exercise.id)}
                          >
                            <Trash2 size={16} />
                            Delete Note
                          </button>
                        ) : (
                          <button
                            className="kebab-menu-item"
                            onClick={() => addNoteToExercise(workoutExercise.id)}
                          >
                            <StickyNote size={16} />
                            Add Note
                          </button>
                        )}
                        {workoutExercise.sets.some((set) => !set.completed && !set.skipped) && (
                          <button
                            className="kebab-menu-item"
                            onClick={() => {
                              skipRemainingSets(workoutExercise.id);
                              setOpenKebabMenu(null);
                            }}
                          >
                            <SkipForward size={16} />
                            Skip Remaining Sets
                          </button>
                        )}
                        <button
                          className="kebab-menu-item"
                          onClick={() => handleReplaceExercise(workoutExercise.id)}
                        >
                          <ArrowLeftRight size={16} />
                          Replace Exercise
                        </button>
                        <button
                          className="kebab-menu-item kebab-menu-item-danger"
                          onClick={() => {
                            const isFromTemplate = !!activeWorkout.templateId;

                            if (isFromTemplate) {
                              // Get exercise position before deletion for template update
                              const exercisePosition = activeWorkout.exercises.findIndex(
                                (e) => e.id === workoutExercise.id
                              );

                              showConfirm({
                                title: "Delete Exercise?",
                                message: "Remove this exercise from your workout.",
                                confirmText: "Send it to the shadow realm",
                                variant: "danger",
                                checkboxLabel: "Update template",
                                checkboxDefaultChecked: true,
                                onConfirm: (checkboxChecked) => {
                                  // Update template first (before removing from workout to preserve position)
                                  if (
                                    checkboxChecked &&
                                    activeWorkout.templateId &&
                                    exercisePosition !== -1
                                  ) {
                                    removeExerciseFromTemplate(
                                      activeWorkout.templateId,
                                      exercisePosition
                                    );
                                  }
                                  // Then remove from workout
                                  removeExerciseFromWorkout(workoutExercise.id);
                                },
                              });
                            } else {
                              // Not from template, delete directly
                              removeExerciseFromWorkout(workoutExercise.id);
                            }

                            setOpenKebabMenu(null);
                          }}
                        >
                          <Trash2 size={16} />
                          Delete Exercise
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {(hasNote(exercise) || editingNoteId === workoutExercise.id) && (
                  <div className="workout-exercise-note-section">
                    {editingNoteId === workoutExercise.id ? (
                      <textarea
                        className="workout-exercise-note-input"
                        value={exercise.notes}
                        onChange={(e) => updateExerciseNote(exercise.id, e.target.value)}
                        onBlur={() => setEditingNoteId(null)}
                        placeholder="Add notes..."
                        autoFocus
                      />
                    ) : (
                      <div
                        className="workout-exercise-note"
                        onClick={() => setEditingNoteId(workoutExercise.id)}
                      >
                        <Edit3 size={16} className="note-edit-icon" />
                        <span>{exercise.notes || "Add notes..."}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="sets-container">
                  <div
                    className={`sets-header ${exercise.exerciseType === "bodyweight" ? "bodyweight" : ""}`}
                  >
                    <span className="set-col-num"></span>
                    {exercise.exerciseType !== "bodyweight" && (
                      <span className="set-col-weight text-uppercase">Weight</span>
                    )}
                    <span className="set-col-reps text-uppercase">Reps</span>
                    <span className="set-col-done text-uppercase">Log</span>
                  </div>
                  {workoutExercise.sets.map((set, setIndex) => {
                    // Get last performed sets for placeholder values
                    const lastSets = getLastPerformedSets(workoutExercise.exerciseId);
                    const lastSet = lastSets && lastSets[setIndex];

                    return (
                      <SetRow
                        key={set.id}
                        set={set}
                        onUpdate={(updates) => updateSet(workoutExercise.id, set.id, updates)}
                        onRemove={() => removeSet(workoutExercise.id, set.id)}
                        canRemove={workoutExercise.sets.length > 1}
                        exerciseType={exercise.exerciseType}
                        placeholderWeight={lastSet?.weight}
                        placeholderReps={lastSet?.reps}
                      />
                    );
                  })}
                </div>

                <button className="add-set-btn" onClick={() => addSet(workoutExercise.id)}>
                  <Plus size={16} />
                  Add Set
                </button>
              </div>
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
            allSetsCompleted() ? "btn btn-primary finish-btn" : "btn btn-secondary finish-btn"
          }
          onClick={allSetsCompleted() ? finishWorkout : cancelWorkout}
        >
          {allSetsCompleted() ? (
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
