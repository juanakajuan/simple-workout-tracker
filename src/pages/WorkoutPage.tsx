import { useState } from "react";
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
import {
  STORAGE_KEYS,
  generateId,
  DEFAULT_EXERCISES,
  getLastPerformedSets,
} from "../utils/storage";

import { SetRow } from "../components/SetRow";
import { ExerciseSelector } from "../components/ExerciseSelector";
import { WorkoutTimer } from "../components/WorkoutTimer";

import "./WorkoutPage.css";

export function WorkoutPage() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  const [activeWorkout, setActiveWorkout] = useLocalStorage<Workout | null>(
    STORAGE_KEYS.ACTIVE_WORKOUT,
    null
  );
  const [settings] = useLocalStorage<Settings>(STORAGE_KEYS.SETTINGS, {
    autoMatchWeight: false,
  });
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [openKebabMenu, setOpenKebabMenu] = useState<string | null>(null);
  const [replacingWorkoutExerciseId, setReplacingWorkoutExerciseId] = useState<string | null>(null);
  const [updateTemplateOnReplace, setUpdateTemplateOnReplace] = useState(true);

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
   * Closes the exercise selector modal after adding.
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
    setShowExerciseSelector(false);
  };

  /**
   * Creates a new exercise and persists it to localStorage. If not in replacement
   * mode, automatically adds the new exercise to the active workout.
   *
   * @param exerciseData - Exercise data without the id field
   * @returns The unique identifier of the newly created exercise
   */
  const handleCreateExercise = (exerciseData: Omit<Exercise, "id">): string => {
    const newExercise: Exercise = {
      ...exerciseData,
      id: generateId(),
    };

    // Persist via localStorage
    setExercises([...exercises, newExercise]);

    // Only auto-add to workout if not in replacement mode
    if (!replacingWorkoutExerciseId) {
      addExerciseToWorkout(newExercise.id);
    }

    return newExercise.id;
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

  /**
   * Updates the set count for a specific exercise in a template. Used to keep
   * templates in sync when sets are added or removed during a workout.
   *
   * @param templateId - The unique identifier of the template
   * @param templateDayId - The unique identifier of the template day
   * @param exercisePositionInWorkout - The zero-based position of the exercise in the workout
   * @param newSetCount - The new number of sets for the exercise
   */
  const updateTemplateSetCount = (
    templateId: string,
    templateDayId: string,
    exercisePositionInWorkout: number,
    newSetCount: number
  ) => {
    const template = templates.find((template) => template.id === templateId);
    if (!template) return;

    const day = template.days.find((day) => day.id === templateDayId);
    if (!day) return;

    let currentPosition = 0;
    let targetMuscleGroupId: string | null = null;
    let targetExerciseId: string | null = null;

    for (const muscleGroup of day.muscleGroups) {
      for (const exercise of muscleGroup.exercises) {
        if (currentPosition === exercisePositionInWorkout) {
          targetMuscleGroupId = muscleGroup.id;
          targetExerciseId = exercise.id;
          break;
        }
        currentPosition++;
      }
      if (targetMuscleGroupId) break;
    }

    if (!targetMuscleGroupId || !targetExerciseId) return;

    const updatedTemplates = templates.map((template) => {
      if (template.id !== templateId) return template;

      return {
        ...template,
        days: template.days.map((day) => {
          if (day.id !== templateDayId) return day;

          return {
            ...day,
            muscleGroups: day.muscleGroups.map((muscleGroup) => {
              if (muscleGroup.id !== targetMuscleGroupId) return muscleGroup;

              return {
                ...muscleGroup,
                exercises: muscleGroup.exercises.map((exercise) => {
                  if (exercise.id !== targetExerciseId) return exercise;
                  return { ...exercise, setCount: newSetCount };
                }),
              };
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
    if (activeWorkout.templateId && activeWorkout.templateDayId) {
      const workoutExerciseIndex = activeWorkout.exercises.findIndex(
        (exercise) => exercise.id === workoutExerciseId
      );
      if (workoutExerciseIndex !== -1) {
        const updatedExercise = updatedWorkout.exercises[workoutExerciseIndex];
        updateTemplateSetCount(
          activeWorkout.templateId,
          activeWorkout.templateDayId,
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
    if (activeWorkout.templateId && activeWorkout.templateDayId) {
      const workoutExerciseIndex = activeWorkout.exercises.findIndex(
        (exercise) => exercise.id === workoutExerciseId
      );
      if (workoutExerciseIndex !== -1) {
        const updatedExercise = updatedWorkout.exercises[workoutExerciseIndex];
        updateTemplateSetCount(
          activeWorkout.templateId,
          activeWorkout.templateDayId,
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
    if (confirm("Are you sure you want to cancel this workout? All progress will be lost.")) {
      setActiveWorkout(null);
      setWorkoutName("");
    }
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

    if (updateTemplateOnReplace && activeWorkout.templateId && activeWorkout.templateDayId) {
      updateTemplateExercise(
        activeWorkout.templateId,
        activeWorkout.templateDayId,
        workoutExerciseIndex,
        newExerciseId
      );
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
   * @param templateDayId - The unique identifier of the template day
   * @param exercisePositionInWorkout - The zero-based position of the exercise in the workout
   * @param newExerciseId - The unique identifier of the new exercise
   */
  const updateTemplateExercise = (
    templateId: string,
    templateDayId: string,
    exercisePositionInWorkout: number,
    newExerciseId: string
  ) => {
    const template = templates.find((template) => template.id === templateId);
    if (!template) return;

    const day = template.days.find((day) => day.id === templateDayId);
    if (!day) return;

    let currentPosition = 0;
    let targetMuscleGroupId: string | null = null;
    let targetExerciseId: string | null = null;

    for (const muscleGroup of day.muscleGroups) {
      for (const exercise of muscleGroup.exercises) {
        if (currentPosition === exercisePositionInWorkout) {
          targetMuscleGroupId = muscleGroup.id;
          targetExerciseId = exercise.id;
          break;
        }
        currentPosition++;
      }
      if (targetMuscleGroupId) break;
    }

    if (!targetMuscleGroupId || !targetExerciseId) return;

    const updatedTemplates = templates.map((template) => {
      if (template.id !== templateId) return template;

      return {
        ...template,
        days: template.days.map((day) => {
          if (day.id !== templateDayId) return day;

          return {
            ...day,
            muscleGroups: day.muscleGroups.map((muscleGroup) => {
              if (muscleGroup.id !== targetMuscleGroupId) return muscleGroup;

              return {
                ...muscleGroup,
                exercises: muscleGroup.exercises.map((exercise) => {
                  if (exercise.id !== targetExerciseId) return exercise;
                  return { ...exercise, exerciseId: newExerciseId };
                }),
              };
            }),
          };
        }),
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
   * Checks if all sets in the active workout have been completed.
   *
   * @returns True if all sets are completed (and workout has exercises), false otherwise
   */
  const allSetsCompleted = () => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return false;
    return activeWorkout.exercises.every((workoutExercise) =>
      workoutExercise.sets.every((set) => set.completed)
    );
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
                      <h3 className="workout-exercise-name">{exercise.name}</h3>
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
                        <button
                          className="kebab-menu-item"
                          onClick={() => {
                            setReplacingWorkoutExerciseId(workoutExercise.id);
                            setOpenKebabMenu(null);
                          }}
                        >
                          <ArrowLeftRight size={16} />
                          Replace Exercise
                        </button>
                        <button
                          className="kebab-menu-item kebab-menu-item-danger"
                          onClick={() => {
                            removeExerciseFromWorkout(workoutExercise.id);
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
        <button
          className="btn btn-secondary add-exercise-btn"
          onClick={() => setShowExerciseSelector(true)}
        >
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

      {(showExerciseSelector || replacingWorkoutExerciseId) && (
        <ExerciseSelector
          exercises={replacingWorkoutExerciseId ? getReplacementExercises() : allExercises}
          onSelect={(exerciseId) => {
            if (replacingWorkoutExerciseId) {
              replaceExerciseInWorkout(exerciseId);
            } else {
              addExerciseToWorkout(exerciseId);
            }
          }}
          onClose={() => {
            setShowExerciseSelector(false);
            setReplacingWorkoutExerciseId(null);
            setUpdateTemplateOnReplace(true);
          }}
          onCreateExercise={handleCreateExercise}
          hideFilter={!!replacingWorkoutExerciseId}
          isReplacement={!!replacingWorkoutExerciseId}
          currentExerciseId={
            replacingWorkoutExerciseId
              ? activeWorkout?.exercises.find((e) => e.id === replacingWorkoutExerciseId)
                  ?.exerciseId
              : undefined
          }
          showTemplateUpdate={
            !!replacingWorkoutExerciseId &&
            !!activeWorkout?.templateId &&
            !!activeWorkout?.templateDayId
          }
          templateUpdateChecked={updateTemplateOnReplace}
          onTemplateUpdateChange={setUpdateTemplateOnReplace}
        />
      )}
    </div>
  );
}
