import { useEffect } from "react";
import { X, Check, Trash2 } from "lucide-react";

import type { Exercise, Workout } from "../types";
import { muscleGroupLabels, exerciseTypeLabels, getMuscleGroupClassName } from "../types";

import "./WorkoutDetailModal.css";

interface WorkoutDetailModalProps {
  workout: Workout;
  exercises: Exercise[];
  onClose: () => void;
  onDelete: () => void;
}

export function WorkoutDetailModal({
  workout,
  exercises,
  onClose,
  onDelete,
}: WorkoutDetailModalProps) {
  /**
   * Retrieves an exercise by its unique identifier from the exercises list.
   *
   * @param id - The unique identifier of the exercise
   * @returns The exercise if found, undefined otherwise
   */
  const getExerciseById = (id: string) => exercises.find((exercise) => exercise.id === id);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /**
   * Formats a date string into a long format (e.g., "Monday, January 6, 2026").
   *
   * @param dateString - ISO date string to format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalVolume = workout.exercises.reduce(
    (accumulator, exercise) =>
      accumulator +
      exercise.sets.reduce((setAccumulator, set) => setAccumulator + set.weight * set.reps, 0),
    0
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal workout-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{workout.name}</h2>
            <p className="detail-date">{formatDate(workout.date)}</p>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="detail-stats">
          <div className="stat">
            <span className="stat-value">{workout.exercises.length}</span>
            <span className="stat-label">Exercises</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {workout.exercises.reduce((acc, e) => acc + e.sets.length, 0)}
            </span>
            <span className="stat-label">Total Sets</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalVolume.toLocaleString()}</span>
            <span className="stat-label">Volume (lbs)</span>
          </div>
        </div>

        <div className="detail-exercises">
          {workout.exercises.map((workoutExercise) => {
            const exercise = getExerciseById(workoutExercise.exerciseId);
            if (!exercise) return null;

            return (
              <div key={workoutExercise.id} className="detail-exercise">
                <div className="detail-exercise-header">
                  <span className={`tag ${getMuscleGroupClassName(exercise.muscleGroup)}`}>
                    {muscleGroupLabels[exercise.muscleGroup]}
                  </span>
                  <h3 className="detail-exercise-name">{exercise.name}</h3>
                  <span className="detail-exercise-type">
                    {exerciseTypeLabels[exercise.exerciseType]}
                  </span>
                </div>
                <div className="detail-sets">
                  {workoutExercise.sets.map((set, index) => (
                    <div
                      key={set.id}
                      className={`detail-set ${set.completed ? "completed" : "skipped"}`}
                    >
                      <span className="set-num">{index + 1}</span>
                      <span className="set-data">
                        {set.weight} lbs × {set.reps} reps
                      </span>
                      {set.completed && (
                        <Check size={16} strokeWidth={2.5} className="check-icon" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary delete-workout-btn" onClick={onDelete}>
            <Trash2 size={20} />
            Delete Workout
          </button>
        </div>
      </div>
    </div>
  );
}
