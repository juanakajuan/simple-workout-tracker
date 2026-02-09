import { useParams, useNavigate } from "react-router-dom";
import { Check, Trash2 } from "lucide-react";

import type { Exercise } from "../types";
import { muscleGroupLabels, exerciseTypeLabels, getMuscleGroupClassName } from "../types";

import { getWorkouts, DEFAULT_EXERCISES, getExercises } from "../utils/storage";

import { PageHeader } from "../components/PageHeader";

import "./WorkoutDetailPage.css";

export function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const navigate = useNavigate();

  if (!workoutId) {
    navigate(-1);
    return null;
  }

  const workouts = getWorkouts();
  const workout = workouts.find((w) => w.id === workoutId);

  if (!workout) {
    navigate(-1);
    return null;
  }

  // Get all exercises
  const userExercises = getExercises();
  const exercises = [...DEFAULT_EXERCISES, ...userExercises];

  /**
   * Retrieves an exercise by its unique identifier from the exercises list.
   *
   * @param id - The unique identifier of the exercise
   * @returns The exercise if found, undefined otherwise
   */
  const getExerciseById = (id: string) => exercises.find((exercise) => exercise.id === id);

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

  const handleDelete = () => {
    navigate("..", {
      state: { deleteWorkoutId: workoutId },
      relative: "path",
    });
  };

  const handleExerciseClick = (exercise: Exercise) => {
    navigate(`exercise/${exercise.id}`);
  };

  const deleteButton = (
    <button className="btn btn-danger btn-sm detail-delete-btn" onClick={handleDelete}>
      <Trash2 size={18} />
    </button>
  );

  return (
    <div className="workout-detail-page">
      <PageHeader title={workout.name} actions={deleteButton} />

      <div className="workout-detail-content">
        <p className="detail-date">{formatDate(workout.date)}</p>

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
                  <h3
                    className="detail-exercise-name clickable"
                    onClick={() => handleExerciseClick(exercise)}
                  >
                    {exercise.name}
                  </h3>
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
      </div>
    </div>
  );
}
