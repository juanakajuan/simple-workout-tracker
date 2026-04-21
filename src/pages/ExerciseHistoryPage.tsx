import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

import type { Workout } from "../types";
import { exerciseTypeLabels, intensityTechniqueLabels, muscleGroupLabels } from "../types";

import { getExercises, getExerciseHistory, DEFAULT_EXERCISES } from "../utils/storage";
import { getSupersetDisplayLabels } from "../utils/intensityTechniques";

import { PageHeader } from "../components/PageHeader";
import { Tag } from "../components/Tag";

import "./ExerciseHistoryPage.css";

export function ExerciseHistoryPage(): React.ReactElement | null {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  // Find exercise from user exercises or default exercises
  const userExercises = getExercises();
  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = userExercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(userExercises.filter((exercise) => !exercise.id.startsWith("default-")));
  const exercise = allExercises.find((ex) => ex.id === exerciseId);

  const shouldNavigateBack = !exerciseId || !exercise;

  useEffect(() => {
    if (shouldNavigateBack) {
      navigate(-1);
    }
  }, [navigate, shouldNavigateBack]);

  if (shouldNavigateBack) {
    return null;
  }

  const workoutHistory = getExerciseHistory(exercise.id);

  /**
   * Finds this exercise's entry within a workout.
   *
   * @param workout - Workout that may contain the exercise
   * @returns Matching workout exercise entry when present
   */
  const getWorkoutExercise = (workout: Workout): Workout["exercises"][number] | undefined => {
    return workout.exercises.find(
      (workoutExercise) => workoutExercise.exerciseId === exercise.id
    );
  };

  /**
   * Formats a date string into a human-readable format. Returns "Today" or
   * "Yesterday" for recent dates, otherwise returns a formatted date string.
   *
   * @param dateString - ISO date string to format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string): string => {
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
    const workoutExercise = getWorkoutExercise(workout);
    if (!workoutExercise) return 0;

    return workoutExercise.sets.reduce((accumulator, set) => {
      if (set.completed) {
        return accumulator + set.weight * set.reps;
      }
      return accumulator;
    }, 0);
  };

  /**
   * Calculates summary stats across all workouts for this exercise.
   *
   * @returns Completed set count and total volume
   */
  const historySummary = workoutHistory.reduce(
    (accumulator, workout) => {
      const workoutExercise = getWorkoutExercise(workout);
      if (!workoutExercise) {
        return accumulator;
      }

      const completedSets = workoutExercise.sets.filter((set) => set.completed);
      const workoutVolume = completedSets.reduce((totalVolume, set) => {
        return totalVolume + set.weight * set.reps;
      }, 0);

      return {
        totalSets: accumulator.totalSets + completedSets.length,
        totalVolume: accumulator.totalVolume + workoutVolume,
      };
    },
    { totalSets: 0, totalVolume: 0 }
  );

  return (
    <div className="exercise-history-page">
      <PageHeader title={exercise.name} />

      <div className="exercise-history-content">
        <div className="exercise-history-meta">
          <Tag muscleGroup={exercise.muscleGroup}>{muscleGroupLabels[exercise.muscleGroup]}</Tag>
          <Tag>{exerciseTypeLabels[exercise.exerciseType]}</Tag>
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
              <span className="stat-value">{historySummary.totalSets}</span>
              <span className="stat-label">Total Sets</span>
            </div>
            <div className="history-stat">
              <span className="stat-value">{historySummary.totalVolume.toLocaleString()}</span>
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
                const workoutExercise = getWorkoutExercise(workout);
                if (!workoutExercise) return null;

                const workoutVolume = getExerciseVolume(workout);
                const supersetLabels = getSupersetDisplayLabels(workout.exercises);

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
                    {workoutExercise.intensityTechnique && (
                      <div className="history-workout-techniques">
                        <Tag>
                          {workoutExercise.intensityTechnique === "super-set" &&
                          workoutExercise.supersetGroupId
                            ? supersetLabels[workoutExercise.supersetGroupId]
                            : intensityTechniqueLabels[workoutExercise.intensityTechnique]}
                        </Tag>
                      </div>
                    )}
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
