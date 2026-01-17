import { useEffect } from "react";
import { X, Check } from "lucide-react";

import type { Exercise, Workout } from "../types";
import { muscleGroupLabels, exerciseTypeLabels, getMuscleGroupClassName } from "../types";

import { useSwipeToClose } from "../hooks/useSwipeToClose";
import { getExerciseHistory } from "../utils/storage";

import "./ExerciseHistoryModal.css";

interface ExerciseHistoryModalProps {
  exercise: Exercise;
  onClose: () => void;
}

export function ExerciseHistoryModal({ exercise, onClose }: ExerciseHistoryModalProps) {
  const workoutHistory = getExerciseHistory(exercise.id);

  const swipeHandlers = useSwipeToClose(onClose);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /**
   * Formats a date string into a human-readable format. Returns "Today" or
   * "Yesterday" for recent dates, otherwise returns a formatted date string.
   *
   * @param dateString - ISO date string to format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Calculates the total volume for a specific exercise in a workout.
   *
   * @param workout - The workout to calculate volume for
   * @returns Total volume (weight × reps summed across all sets) in lbs
   */
  const getExerciseVolume = (workout: Workout): number => {
    const workoutExercise = workout.exercises.find((ex) => ex.exerciseId === exercise.id);
    if (!workoutExercise) return 0;

    return workoutExercise.sets.reduce((accumulator, set) => {
      if (set.completed) {
        return accumulator + set.weight * set.reps;
      }
      return accumulator;
    }, 0);
  };

  /**
   * Calculates the total number of completed sets for this exercise.
   *
   * @returns Total completed sets across all workouts
   */
  const getTotalSets = (): number => {
    return workoutHistory.reduce((accumulator, workout) => {
      const workoutExercise = workout.exercises.find((ex) => ex.exerciseId === exercise.id);
      if (!workoutExercise) return accumulator;
      return accumulator + workoutExercise.sets.filter((set) => set.completed).length;
    }, 0);
  };

  /**
   * Calculates the total volume across all workouts for this exercise.
   *
   * @returns Total volume in lbs
   */
  const getTotalVolume = (): number => {
    return workoutHistory.reduce((accumulator, workout) => {
      return accumulator + getExerciseVolume(workout);
    }, 0);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ opacity: swipeHandlers.overlayOpacity }}
    >
      {/* eslint-disable react-hooks/refs -- False positive: passing ref object, not accessing .current */}
      <div
        ref={swipeHandlers.ref}
        className="modal exercise-history-modal"
        onClick={(e) => e.stopPropagation()}
        style={swipeHandlers.style}
      >
        {/* eslint-enable react-hooks/refs */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{exercise.name}</h2>
            <div className="exercise-history-meta">
              <span className={`tag ${getMuscleGroupClassName(exercise.muscleGroup)}`}>
                {muscleGroupLabels[exercise.muscleGroup]}
              </span>
              <span className="tag tag-muted">{exerciseTypeLabels[exercise.exerciseType]}</span>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {workoutHistory.length > 0 && (
          <div className="history-stats">
            <div className="history-stat">
              <span className="stat-value">{workoutHistory.length}</span>
              <span className="stat-label">
                {workoutHistory.length === 1 ? "Workout" : "Workouts"}
              </span>
            </div>
            <div className="history-stat">
              <span className="stat-value">{getTotalSets()}</span>
              <span className="stat-label">Total Sets</span>
            </div>
            <div className="history-stat">
              <span className="stat-value">{getTotalVolume().toLocaleString()}</span>
              <span className="stat-label">Volume (lbs)</span>
            </div>
          </div>
        )}

        <div className="history-content">
          {workoutHistory.length === 0 ? (
            <div className="empty-history">
              <p>No history yet</p>
              <p className="hint">
                This exercise has not been performed in any completed workouts.
              </p>
            </div>
          ) : (
            <div className="history-workouts">
              {workoutHistory.map((workout) => {
                const workoutExercise = workout.exercises.find(
                  (ex) => ex.exerciseId === exercise.id
                );
                if (!workoutExercise) return null;

                const workoutVolume = getExerciseVolume(workout);

                return (
                  <div key={workout.id} className="history-workout-entry">
                    <div className="history-workout-header">
                      <div>
                        <h3 className="history-workout-name">{workout.name}</h3>
                        <p className="history-workout-date">{formatDate(workout.date)}</p>
                      </div>
                      {workoutVolume > 0 && (
                        <div className="history-workout-volume">
                          {workoutVolume.toLocaleString()} lbs
                        </div>
                      )}
                    </div>
                    <div className="history-sets">
                      {workoutExercise.sets.map((set, index) => (
                        <div
                          key={set.id}
                          className={`history-set ${set.completed ? "completed" : "skipped"}`}
                        >
                          <span className="set-num">{index + 1}</span>
                          <span className="set-data">
                            {exercise.exerciseType === "bodyweight" ? (
                              <>{set.reps} reps</>
                            ) : (
                              <>
                                {set.weight} lbs × {set.reps} reps
                              </>
                            )}
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
          )}
        </div>
      </div>
    </div>
  );
}
