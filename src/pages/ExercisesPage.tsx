import { useState } from "react";
import { Plus, Dumbbell, Search } from "lucide-react";

import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  STORAGE_KEYS,
  generateId,
  DEFAULT_EXERCISES,
  getLastPerformedDate,
  formatRelativeDate,
} from "../utils/storage";

import type { Exercise, MuscleGroup } from "../types";
import { MUSCLE_GROUPS, EXERCISE_TYPES, muscleGroupLabels, exerciseTypeLabels } from "../types";

import { ExerciseCard } from "../components/ExerciseCard";
import { ExerciseModal } from "../components/ExerciseModal";
import { ExerciseHistoryModal } from "../components/ExerciseHistoryModal";

import "./ExercisesPage.css";

export function ExercisesPage() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState<Exercise | null>(
    null
  );
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Merge default exercises with user exercises, user exercises override defaults
  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = exercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(exercises.filter((exercise) => !exercise.id.startsWith("default-")));

  const filteredExercises = allExercises.filter((exercise) => {
    const matchesMuscle = filterMuscle === "all" || exercise.muscleGroup === filterMuscle;
    const matchesSearch =
      searchQuery === "" || exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMuscle && matchesSearch;
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
   * Saves an exercise to localStorage.
   *
   * @param data - Exercise data without the id field
   */
  const handleSave = (data: Omit<Exercise, "id">) => {
    if (editingExercise) {
      // Check if this is an override for a default exercise
      const existingUserExercise = exercises.find((exercise) => exercise.id === editingExercise.id);

      if (existingUserExercise) {
        // Update existing user exercise or override
        setExercises(
          exercises.map((exercise) =>
            exercise.id === editingExercise.id ? { ...data, id: exercise.id } : exercise
          )
        );
      } else {
        // Create new override for default exercise
        setExercises([...exercises, { ...data, id: editingExercise.id }]);
      }
    } else {
      // Create new user exercise
      setExercises([...exercises, { ...data, id: generateId() }]);
    }
    handleCloseModal();
  };

  /**
   * Deletes an exercise from localStorage. For user-created exercises, this removes
   * them entirely. For default exercise overrides, this removes the override and
   * reverts to the default exercise.
   *
   * @param id - The unique identifier of the exercise to delete
   */
  const handleDelete = (id: string) => {
    setExercises(exercises.filter((exercise) => exercise.id !== id));
  };

  /**
   * Opens the exercise modal in edit mode for the specified exercise.
   *
   * @param exercise - The exercise to edit
   */
  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsModalOpen(true);
  };

  /**
   * Closes the exercise modal and resets the editing state.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExercise(null);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Exercises</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          NEW
        </button>
      </header>

      <div className="filter-bar">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | "all")}
          className="filter-select"
        >
          <option value="all">All Muscles</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {muscleGroupLabels[group]}
            </option>
          ))}
        </select>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="empty-state">
          <Dumbbell size={48} strokeWidth={1.5} />
          <p>No exercises yet. Add your first exercise!</p>
        </div>
      ) : (
        <div className="exercise-groups">
          {(Object.keys(groupedExercises) as MuscleGroup[]).map((group) => (
            <div key={group} className="exercise-group">
              <h2 className="group-title">{muscleGroupLabels[group]}</h2>
              <div className="exercise-list">
                {groupedExercises[group].map((exercise) => {
                  const lastPerformedDate = getLastPerformedDate(exercise.id);
                  const lastPerformed = lastPerformedDate
                    ? formatRelativeDate(lastPerformedDate)
                    : null;

                  return (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onClick={() => setSelectedExerciseForHistory(exercise)}
                      onEdit={() => handleEdit(exercise)}
                      isDefault={exercise.id.startsWith("default-")}
                      lastPerformed={lastPerformed}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ExerciseModal
          exercise={editingExercise}
          onSave={handleSave}
          onClose={handleCloseModal}
          onDelete={
            editingExercise && !editingExercise.id.startsWith("default-")
              ? () => {
                  handleDelete(editingExercise.id);
                  handleCloseModal();
                }
              : undefined
          }
          muscleGroups={MUSCLE_GROUPS}
          exerciseTypes={EXERCISE_TYPES}
          muscleGroupLabels={muscleGroupLabels}
          exerciseTypeLabels={exerciseTypeLabels}
        />
      )}

      {selectedExerciseForHistory && (
        <ExerciseHistoryModal
          exercise={selectedExerciseForHistory}
          onClose={() => setSelectedExerciseForHistory(null)}
        />
      )}
    </div>
  );
}
