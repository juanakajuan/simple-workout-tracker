import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, MoreVertical, Pencil, Trash2 } from "lucide-react";

import type { Exercise, Workout } from "../types";
import { exerciseTypeLabels, intensityTechniqueLabels, muscleGroupLabels } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS, DEFAULT_EXERCISES, getExercises } from "../utils/storage";
import { getSupersetDisplayLabels } from "../utils/intensityTechniques";

import { PageHeader } from "../components/PageHeader";
import { Tag } from "../components/Tag";

import "./WorkoutDetailPage.css";

export function WorkoutDetailPage(): React.ReactElement | null {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  const workout = workouts.find((w) => w.id === workoutId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [workoutName, setWorkoutName] = useState(() => workout?.name ?? "");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const shouldNavigateBack = !workoutId || !workout;

  useEffect(() => {
    if (shouldNavigateBack) {
      navigate(-1);
    }
  }, [navigate, shouldNavigateBack]);

  if (shouldNavigateBack) {
    return null;
  }

  // Get all exercises
  const userExercises = getExercises();
  const exercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = userExercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(userExercises.filter((exercise) => !exercise.id.startsWith("default-")));

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
      exercise.sets.reduce((setAccumulator, set) => {
        if (set.completed) {
          return setAccumulator + set.weight * set.reps;
        }
        return setAccumulator;
      }, 0),
    0
  );
  const supersetLabels = getSupersetDisplayLabels(workout.exercises);

  const handleDelete = () => {
    setIsMenuOpen(false);
    navigate("/history", {
      replace: true,
      state: { deleteWorkoutId: workoutId },
    });
  };

  const handleStartRename = () => {
    setIsMenuOpen(false);
    setWorkoutName(workout.name);
    setIsEditingName(true);
  };

  const handleCancelRename = () => {
    setWorkoutName(workout.name);
    setIsEditingName(false);
  };

  const handleSaveName = () => {
    const trimmedName = workoutName.trim();

    if (!trimmedName) {
      setWorkoutName(workout.name);
      setIsEditingName(false);
      return;
    }

    if (trimmedName !== workout.name) {
      setWorkouts((currentWorkouts) =>
        currentWorkouts.map((currentWorkout) =>
          currentWorkout.id === workout.id
            ? { ...currentWorkout, name: trimmedName }
            : currentWorkout
        )
      );
    }

    setWorkoutName(trimmedName);
    setIsEditingName(false);
  };

  const handleExerciseClick = (exercise: Exercise) => {
    navigate(`exercise/${exercise.id}`);
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSaveName();
    }

    if (event.key === "Escape") {
      handleCancelRename();
    }
  };

  const headerActions = (
    <div className="detail-kebab-menu" ref={menuRef}>
      <button
        type="button"
        className="btn btn-ghost btn-icon detail-header-btn"
        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        aria-label="More options"
        aria-expanded={isMenuOpen}
      >
        <MoreVertical size={18} />
      </button>
      {isMenuOpen && (
        <div className="detail-kebab-dropdown">
          <button type="button" className="detail-kebab-item" onClick={handleStartRename}>
            <Pencil size={16} />
            Rename workout
          </button>
          <button
            type="button"
            className="detail-kebab-item detail-kebab-item-danger"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Delete workout
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="workout-detail-page">
      <PageHeader title={workout.name} actions={headerActions} />

      <div className="workout-detail-content">
        {isEditingName && (
          <div className="detail-name-editor card">
            <label className="detail-name-label" htmlFor="workout-name-input">
              Workout name
            </label>
            <div className="detail-name-row">
              <input
                id="workout-name-input"
                type="text"
                value={workoutName}
                onChange={(event) => setWorkoutName(event.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="Workout name"
                autoFocus
              />
              <div className="detail-name-actions">
                <button
                  type="button"
                  className="btn btn-secondary detail-name-cancel"
                  onClick={handleCancelRename}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary detail-name-save"
                  onClick={handleSaveName}
                  disabled={!workoutName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

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
            const existingExercise = getExerciseById(workoutExercise.exerciseId);
            const exercise = existingExercise ?? workoutExercise.exerciseSnapshot;
            if (!exercise) return null;

            return (
              <div key={workoutExercise.id} className="detail-exercise">
                <div className="detail-exercise-header">
                  <div className="detail-exercise-tags">
                    <Tag muscleGroup={exercise.muscleGroup}>
                      {muscleGroupLabels[exercise.muscleGroup]}
                    </Tag>
                    {workoutExercise.intensityTechnique && (
                      <Tag>
                        {workoutExercise.intensityTechnique === "super-set" &&
                        workoutExercise.supersetGroupId
                          ? supersetLabels[workoutExercise.supersetGroupId]
                          : intensityTechniqueLabels[workoutExercise.intensityTechnique]}
                      </Tag>
                    )}
                  </div>
                  <h3
                    className={`detail-exercise-name ${existingExercise ? "clickable" : ""}`}
                    onClick={
                      existingExercise ? () => handleExerciseClick(existingExercise) : undefined
                    }
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
