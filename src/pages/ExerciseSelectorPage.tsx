import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Clock, Check } from "lucide-react";

import type { Exercise, MuscleGroup } from "../types";
import { muscleGroupLabels, exerciseTypeLabels, MUSCLE_GROUPS } from "../types";
import { getLastPerformedDate, formatRelativeDate } from "../utils/storage";

import { PageHeader } from "../components/PageHeader";

import "./ExerciseSelectorPage.css";

interface TemplateSelectionTarget {
  muscleGroupId: string;
  exerciseId: string;
  muscleGroup: MuscleGroup;
}

interface ExerciseSelectorState {
  exercises?: Exercise[];
  hideFilter?: boolean;
  initialMuscleGroup?: MuscleGroup;
  isReplacement?: boolean;
  currentExerciseId?: string;
  showTemplateUpdate?: boolean;
  templateUpdateChecked?: boolean;
  isTemplateWorkout?: boolean;
  templateSelectionTarget?: TemplateSelectionTarget;
}

export function ExerciseSelectorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ExerciseSelectorState | undefined;

  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | "all">(
    state?.initialMuscleGroup ?? "all"
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [updateTemplate, setUpdateTemplate] = useState(state?.templateUpdateChecked || false);
  const exerciseRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    // Listen for navigation events to handle exercise creation
    const handleSavedExercise = () => {
      if (location.state?.savedExercise) {
        const { exerciseId } = location.state;

        // Auto-select the newly created exercise in replacement or template workout mode
        if (state?.isReplacement || state?.isTemplateWorkout) {
          setSelectedExerciseId(exerciseId || "new");
        }
      }
    };

    handleSavedExercise();
  }, [location.state, state?.isReplacement, state?.isTemplateWorkout]);

  useEffect(() => {
    if (selectedExerciseId && exerciseRefs.current[selectedExerciseId]) {
      exerciseRefs.current[selectedExerciseId]?.scrollIntoView({
        behavior: "instant",
        block: "center",
      });
    }
  }, [selectedExerciseId]);

  if (!state) {
    navigate(-1);
    return null;
  }

  const {
    exercises = [],
    hideFilter = false,
    isReplacement = false,
    currentExerciseId,
    showTemplateUpdate = false,
    isTemplateWorkout = false,
  } = state;

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = filterMuscle === "all" || exercise.muscleGroup === filterMuscle;
    const notCurrentExercise = !isReplacement || exercise.id !== currentExerciseId;
    return matchesSearch && matchesMuscle && notCurrentExercise;
  });

  const groupedExercises = filteredExercises.reduce(
    (accumulator, exercise) => {
      const group = exercise.muscleGroup;
      if (!accumulator[group]) accumulator[group] = [];
      accumulator[group].push(exercise);
      return accumulator;
    },
    {} as Record<MuscleGroup, Exercise[]>
  );

  // Sort exercises alphabetically within each group
  Object.keys(groupedExercises).forEach((group) => {
    groupedExercises[group as MuscleGroup].sort((a, b) => a.name.localeCompare(b.name));
  });

  /**
   * Handles clicking an exercise. In replacement or template workout mode, toggles selection.
   * In normal mode, immediately selects the exercise.
   *
   * @param exerciseId - The unique identifier of the clicked exercise
   */
  const handleExerciseClick = (exerciseId: string) => {
    if (isReplacement || isTemplateWorkout) {
      setSelectedExerciseId((previous) => (previous === exerciseId ? null : exerciseId));
    } else {
      navigate("..", {
        state: {
          selectedExerciseId: exerciseId,
          updateTemplate,
          templateSelectionTarget: state?.templateSelectionTarget,
        },
        relative: "path",
      });
    }
  };

  /**
   * Confirms the exercise selection in replacement mode.
   */
  const handleConfirmSelection = () => {
    if (selectedExerciseId) {
      navigate("..", {
        state: {
          selectedExerciseId,
          updateTemplate,
          templateSelectionTarget: state?.templateSelectionTarget,
        },
        relative: "path",
      });
    }
  };

  const handleCreateNew = () => {
    navigate("new", {
      state: { initialMuscleGroup: state.initialMuscleGroup },
    });
  };

  const newButton = (
    <button className="btn btn-primary btn-sm btn-new-exercise" onClick={handleCreateNew}>
      <Plus size={16} />
      New
    </button>
  );

  return (
    <div className="exercise-selector-page">
      <PageHeader title="Select Exercise" actions={newButton} />

      <div className="exercise-selector-content">
        <div className="selector-filters">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!hideFilter && (
            <select
              value={filterMuscle}
              onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | "all")}
            >
              <option value="all">All Muscles</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {muscleGroupLabels[group]}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="selector-list">
          {exercises.length === 0 ? (
            <div className="selector-empty">
              <p>No exercises created yet.</p>
              <p className="hint">Go to the Exercises tab to add some!</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="selector-empty">
              <p>No exercises match your search.</p>
            </div>
          ) : (
            Object.entries(groupedExercises).map(([group, groupExercises]) => (
              <div key={group} className="selector-group">
                <h3 className="selector-group-title">{muscleGroupLabels[group as MuscleGroup]}</h3>
                {groupExercises.map((exercise) => {
                  const lastPerformedDate = getLastPerformedDate(exercise.id);
                  const lastPerformed = lastPerformedDate
                    ? formatRelativeDate(lastPerformedDate)
                    : null;

                  const isSelected =
                    (isReplacement || isTemplateWorkout) && selectedExerciseId === exercise.id;

                  return (
                    <button
                      key={exercise.id}
                      ref={(element) => {
                        exerciseRefs.current[exercise.id] = element;
                      }}
                      className={`selector-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleExerciseClick(exercise.id)}
                    >
                      <div className="selector-item-info">
                        <span className="selector-item-name">{exercise.name}</span>
                        <span className="selector-item-type">
                          {exerciseTypeLabels[exercise.exerciseType]}
                        </span>
                        {lastPerformed && (
                          <span className="selector-item-last-performed">
                            <Clock size={12} />
                            Last performed {lastPerformed}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check size={20} />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {(isReplacement || isTemplateWorkout) && (
        <div className="selector-footer">
          {showTemplateUpdate && (
            <label className="selector-template-update-label">
              <input
                type="checkbox"
                checked={updateTemplate}
                onChange={(e) => setUpdateTemplate(e.target.checked)}
              />
              <span>Update template</span>
            </label>
          )}
          <button
            className="btn btn-primary selector-ok-button"
            onClick={handleConfirmSelection}
            disabled={!selectedExerciseId}
          >
            <Check size={18} />
            OK
          </button>
        </div>
      )}
    </div>
  );
}
