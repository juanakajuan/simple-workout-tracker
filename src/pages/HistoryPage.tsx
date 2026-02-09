import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { History } from "lucide-react";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { STORAGE_KEYS, DEFAULT_EXERCISES } from "../utils/storage";

import type { Exercise, Workout, MuscleGroup } from "../types";
import { muscleGroupLabels, getMuscleGroupClassName } from "../types";

import { ConfirmDialog } from "../components/ConfirmDialog";

import "./HistoryPage.css";

export function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  const [userExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const { showConfirm, dialogProps } = useConfirmDialog();

  // Merge default exercises with user exercises, user exercises override defaults
  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = userExercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(userExercises.filter((exercise) => !exercise.id.startsWith("default-")));

  /**
   * Retrieves an exercise by its unique identifier from the merged list of
   * default and user exercises.
   *
   * @param id - The unique identifier of the exercise
   * @returns The exercise if found, undefined otherwise
   */
  const getExerciseById = (id: string) => allExercises.find((exercise) => exercise.id === id);

  /**
   * Formats a date string into a human-readable format. Returns "Today" or
   * "Yesterday" for recent dates, otherwise returns a formatted date string
   * (e.g., "Mon, Jan 6").
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
    });
  };

  /**
   * Calculates statistics for a workout including total sets, completed sets,
   * and total volume (weight x reps summed across all sets).
   *
   * @param workout - The workout to calculate statistics for
   * @returns Object containing totalSets, completedSets, and totalVolume (in lbs)
   */
  const getWorkoutStats = (workout: Workout) => {
    const totalSets = workout.exercises.reduce(
      (accumulator, exercise) => accumulator + exercise.sets.length,
      0
    );
    const completedSets = workout.exercises.reduce(
      (accumulator, exercise) => accumulator + exercise.sets.filter((set) => set.completed).length,
      0
    );
    const totalVolume = workout.exercises.reduce(
      (accumulator, exercise) =>
        accumulator +
        exercise.sets.reduce((setAccumulator, set) => setAccumulator + set.weight * set.reps, 0),
      0
    );
    return { totalSets, completedSets, totalVolume };
  };

  /**
   * Formats a duration in seconds into a human-readable string.
   * Returns format like "2h 30m" for durations over an hour, or "45 min" otherwise.
   *
   * @param seconds - Duration in seconds, or undefined
   * @returns Formatted duration string, or empty string if seconds is undefined
   */
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  /**
   * Deletes a workout from localStorage after user confirmation.
   *
   * @param id - The unique identifier of the workout to delete
   */
  const handleDeleteWorkout = useCallback(
    (id: string) => {
      showConfirm({
        title: "Delete this workout?",
        message: "This action cannot be undone.",
        confirmText: "Send it to the shadow realm",
        cancelText: "Cancel",
        variant: "danger",
        onConfirm: () => {
          setWorkouts(workouts.filter((workout) => workout.id !== id));
        },
      });
    },
    [showConfirm, workouts, setWorkouts]
  );

  /**
   * Listens for delete workout requests from location state.
   * When a workout detail page requests deletion, it navigates back with
   * the workout ID to delete.
   */
  useEffect(() => {
    const state = location.state as { deleteWorkoutId?: string } | null;
    if (state?.deleteWorkoutId) {
      handleDeleteWorkout(state.deleteWorkoutId);
      // Clear the state to prevent re-triggering on future navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, handleDeleteWorkout]);

  // Group workouts by month
  const groupedWorkouts = workouts.reduce(
    (accumulator, workout) => {
      const date = new Date(workout.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!accumulator[monthKey]) {
        accumulator[monthKey] = { label: monthLabel, workouts: [] };
      }
      accumulator[monthKey].workouts.push(workout);
      return accumulator;
    },
    {} as Record<string, { label: string; workouts: Workout[] }>
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">History</h1>
        {workouts.length > 0 && <span className="workout-count">{workouts.length} Workouts</span>}
      </header>

      {workouts.length === 0 ? (
        <div className="empty-state">
          <History size={48} strokeWidth={1.5} />
          <p>No completed workouts yet.</p>
          <p className="hint">Your workout history will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {Object.entries(groupedWorkouts).map(([monthKey, { label, workouts: monthWorkouts }]) => (
            <div key={monthKey} className="history-month">
              <h2 className="month-title">{label}</h2>
              <div className="month-workouts">
                {monthWorkouts.map((workout) => {
                  const stats = getWorkoutStats(workout);
                  return (
                    <button
                      key={workout.id}
                      className="history-card card"
                      onClick={() => navigate(`/history/workout/${workout.id}`)}
                    >
                      <div className="history-card-header">
                        <div className="history-card-date">{formatDate(workout.date)}</div>
                        <div className="history-card-volume">
                          {stats.totalVolume.toLocaleString()} lbs
                        </div>
                      </div>
                      <h3 className="history-card-name">{workout.name}</h3>
                      <div className="history-card-meta">
                        <span>{workout.exercises.length} exercises</span>
                        <span className="dot">•</span>
                        <span>{stats.completedSets} sets</span>
                        {workout.duration && (
                          <>
                            <span className="dot">•</span>
                            <span>{formatDuration(workout.duration)}</span>
                          </>
                        )}
                      </div>
                      <div className="history-card-exercises">
                        {(() => {
                          const muscleGroups = Array.from(
                            new Set(
                              workout.exercises
                                .map((we) => getExerciseById(we.exerciseId)?.muscleGroup)
                                .filter((mg): mg is MuscleGroup => mg !== undefined)
                            )
                          );
                          return muscleGroups.map((muscleGroup) => (
                            <span
                              key={muscleGroup}
                              className={`tag ${getMuscleGroupClassName(muscleGroup)}`}
                            >
                              {muscleGroupLabels[muscleGroup]}
                            </span>
                          ));
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
