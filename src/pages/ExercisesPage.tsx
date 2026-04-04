import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Dumbbell, Search } from "lucide-react";

import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  STORAGE_KEYS,
  DEFAULT_EXERCISES,
  getLastPerformedDate,
  formatRelativeDate,
} from "../utils/storage";

import type { Exercise, MuscleGroup } from "../types";
import { MUSCLE_GROUPS, muscleGroupLabels } from "../types";

import { ExerciseCard } from "../components/ExerciseCard";
import { PageHeader } from "../components/PageHeader";

import "./ExercisesPage.css";

export function ExercisesPage() {
  const navigate = useNavigate();
  const [exercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
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
   * Opens the exercise creation page.
   */
  const handleCreate = () => {
    navigate("/exercises/new");
  };

  /**
   * Opens the exercise edit page for the specified exercise.
   *
   * @param exercise - The exercise to edit
   */
  const handleEdit = (exercise: Exercise) => {
    navigate(`/exercises/edit/${exercise.id}`);
  };

  /**
   * Opens the exercise history page for the specified exercise.
   *
   * @param exercise - The exercise to view history for
   */
  const handleViewHistory = (exercise: Exercise) => {
    navigate(`/exercises/history/${exercise.id}`);
  };

  return (
    <div className="page">
      <PageHeader
        title="Exercises"
        showBackButton={false}
        actions={
          <button
            type="button"
            className="btn btn-icon page-header-action"
            onClick={handleCreate}
            aria-label="Create new exercise"
          >
            <Plus size={20} />
          </button>
        }
      />

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
                      onClick={() => handleViewHistory(exercise)}
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
    </div>
  );
}
