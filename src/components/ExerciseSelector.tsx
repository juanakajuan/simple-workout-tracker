import { useState, useEffect } from "react";
import { X, Search, Plus, Clock, Check } from "lucide-react";

import type { Exercise, MuscleGroup } from "../types";
import { muscleGroupLabels, exerciseTypeLabels, MUSCLE_GROUPS, EXERCISE_TYPES } from "../types";
import { getLastPerformedDate, formatRelativeDate } from "../utils/storage";

import { ExerciseModal } from "./ExerciseModal";

import "./ExerciseSelector.css";

interface ExerciseSelectorProps {
  exercises: Exercise[];
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
  hideFilter?: boolean;
  onCreateExercise?: (exercise: Omit<Exercise, "id">) => void;
  initialMuscleGroup?: MuscleGroup;
  isReplacement?: boolean;
  currentExerciseId?: string;
  showTemplateUpdate?: boolean;
  onTemplateUpdateChange?: (update: boolean) => void;
  templateUpdateChecked?: boolean;
}

export function ExerciseSelector({
  exercises,
  onSelect,
  onClose,
  hideFilter = false,
  onCreateExercise,
  initialMuscleGroup,
  isReplacement = false,
  currentExerciseId,
  showTemplateUpdate = false,
  onTemplateUpdateChange,
  templateUpdateChecked = false,
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = filterMuscle === "all" || exercise.muscleGroup === filterMuscle;
    const notCurrentExercise = !isReplacement || exercise.id !== currentExerciseId;
    return matchesSearch && matchesMuscle && notCurrentExercise;
  });

  const groupedExercises = filteredExercises.reduce(
    (acc, exercise) => {
      const group = exercise.muscleGroup;
      if (!acc[group]) acc[group] = [];
      acc[group].push(exercise);
      return acc;
    },
    {} as Record<MuscleGroup, Exercise[]>
  );

  const handleCreateExercise = (exerciseData: Omit<Exercise, "id">) => {
    if (onCreateExercise) {
      onCreateExercise(exerciseData);
      setShowCreateModal(false);
    }
  };

  const handleExerciseClick = (exerciseId: string) => {
    if (isReplacement) {
      setSelectedExerciseId((previous) => (previous === exerciseId ? null : exerciseId));
    } else {
      onSelect(exerciseId);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedExerciseId) {
      onSelect(selectedExerciseId);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal exercise-selector-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Select Exercise</h2>
            <div className="exercise-selector-header-actions">
              {onCreateExercise && (
                <button
                  className="btn btn-primary btn-sm btn-new-exercise"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={16} />
                  New
                </button>
              )}
              <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
                <X size={20} />
              </button>
            </div>
          </div>

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
                  <h3 className="selector-group-title">
                    {muscleGroupLabels[group as MuscleGroup]}
                  </h3>
                  {groupExercises.map((exercise) => {
                    const lastPerformedDate = getLastPerformedDate(exercise.id);
                    const lastPerformed = lastPerformedDate
                      ? formatRelativeDate(lastPerformedDate)
                      : null;

                    const isSelected = isReplacement && selectedExerciseId === exercise.id;

                    return (
                      <button
                        key={exercise.id}
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

          {isReplacement && (
            <div className="selector-footer">
              {showTemplateUpdate && (
                <label className="selector-template-update-label">
                  <input
                    type="checkbox"
                    checked={templateUpdateChecked}
                    onChange={(e) => onTemplateUpdateChange?.(e.target.checked)}
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
      </div>

      {showCreateModal && (
        <ExerciseModal
          exercise={initialMuscleGroup ? ({ muscleGroup: initialMuscleGroup } as Exercise) : null}
          onSave={handleCreateExercise}
          onClose={() => setShowCreateModal(false)}
          muscleGroups={MUSCLE_GROUPS}
          exerciseTypes={EXERCISE_TYPES}
          muscleGroupLabels={muscleGroupLabels}
          exerciseTypeLabels={exerciseTypeLabels}
        />
      )}
    </>
  );
}
