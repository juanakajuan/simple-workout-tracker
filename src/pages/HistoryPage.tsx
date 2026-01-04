import { useState } from "react";
import { History } from "lucide-react";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS, DEFAULT_EXERCISES } from "../utils/storage";

import type { Exercise, Workout, MuscleGroup } from "../types";
import { muscleGroupLabels, getMuscleGroupClassName } from "../types";

import { WorkoutDetailModal } from "../components/WorkoutDetailModal";

import "./HistoryPage.css";

export function HistoryPage() {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  const [userExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Merge default exercises with user exercises, user exercises override defaults
  const allExercises = DEFAULT_EXERCISES.map((defaultEx) => {
    const userOverride = userExercises.find((e) => e.id === defaultEx.id);
    return userOverride || defaultEx;
  }).concat(userExercises.filter((e) => !e.id.startsWith("default-")));

  const getExerciseById = (id: string) => allExercises.find((e) => e.id === id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "TODAY";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "YESTERDAY";
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getWorkoutStats = (workout: Workout) => {
    const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.length, 0);
    const completedSets = workout.exercises.reduce(
      (acc, e) => acc + e.sets.filter((s) => s.completed).length,
      0
    );
    const totalVolume = workout.exercises.reduce(
      (acc, e) => acc + e.sets.reduce((setAcc, s) => setAcc + s.weight * s.reps, 0),
      0
    );
    return { totalSets, completedSets, totalVolume };
  };

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) return "";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const handleDeleteWorkout = (id: string) => {
    if (confirm("Are you sure you want to delete this workout?")) {
      setWorkouts(workouts.filter((w) => w.id !== id));
      setSelectedWorkout(null);
    }
  };

  // Group workouts by month
  const groupedWorkouts = workouts.reduce(
    (acc, workout) => {
      const date = new Date(workout.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!acc[monthKey]) {
        acc[monthKey] = { label: monthLabel, workouts: [] };
      }
      acc[monthKey].workouts.push(workout);
      return acc;
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
                      onClick={() => setSelectedWorkout(workout)}
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

      {selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          exercises={allExercises}
          onClose={() => setSelectedWorkout(null)}
          onDelete={() => handleDeleteWorkout(selectedWorkout.id)}
        />
      )}
    </div>
  );
}
