import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";

import type { Exercise, MuscleGroup, ExerciseType } from "../types";
import { MUSCLE_GROUPS, EXERCISE_TYPES, muscleGroupLabels, exerciseTypeLabels } from "../types";

import {
  getExercises,
  saveExercises,
  generateId,
  DEFAULT_EXERCISES,
  deleteExerciseAndRepairReferences,
} from "../utils/storage";

import { PageHeader } from "../components/PageHeader";

import "./ExerciseFormPage.css";

export function ExerciseFormPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { exerciseId } = useParams();
  const locationState = location.state as (Record<string, unknown> & { exercise?: Exercise }) | null;

  const navigateBack = (state: Record<string, unknown>): void => {
    if (location.pathname.startsWith("/exercises/")) {
      navigate("/exercises", { state });
      return;
    }

    navigate("..", {
      state: {
        ...locationState,
        ...state,
      },
      relative: "path",
    });
  };

  // Get exercise to edit (either from URL param or location state)
  const exerciseToEdit: Exercise | null = (() => {
    if (exerciseId) {
      const userExercises = getExercises();
      const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
        const userOverride = userExercises.find((exercise) => exercise.id === defaultExercise.id);
        return userOverride ?? defaultExercise;
      }).concat(userExercises.filter((exercise) => !exercise.id.startsWith("default-")));

      return allExercises.find((exercise) => exercise.id === exerciseId) ?? null;
    }

    return locationState?.exercise ?? null;
  })();

  const [name, setName] = useState(exerciseToEdit?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    exerciseToEdit?.muscleGroup ?? "chest"
  );
  const [exerciseType, setExerciseType] = useState<ExerciseType>(
    exerciseToEdit?.exerciseType ?? "barbell"
  );
  const [notes, setNotes] = useState(exerciseToEdit?.notes ?? "");

  // Check if this is a default exercise (not yet overridden by user)
  const isDefaultExercise = exerciseToEdit?.id.startsWith("default-") ?? false;
  const disabledFieldClassName = isDefaultExercise ? "disabled-field" : "";

  /**
   * Handles form submission. Validates that the name is not empty,
   * persists the exercise, then navigates back with the saved exercise ID.
   *
   * @param event - The form submit event
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!name.trim()) return;

    const exerciseData = {
      name: name.trim(),
      muscleGroup,
      exerciseType,
      notes: notes.trim(),
    };

    const userExercises = getExercises();
    const savedExerciseId = exerciseToEdit?.id ?? generateId();
    const existingExerciseIndex = userExercises.findIndex(
      (exercise) => exercise.id === savedExerciseId
    );
    const savedExercise = { ...exerciseData, id: savedExerciseId };

    const nextExercises =
      existingExerciseIndex >= 0
        ? userExercises.map((exercise) =>
            exercise.id === savedExerciseId ? savedExercise : exercise
          )
        : [...userExercises, savedExercise];

    saveExercises(nextExercises);

    navigateBack({ savedExerciseId });
  };

  /**
   * Handles deleting an exercise. Removes any user exercise or override,
   * then navigates back with the deleted exercise ID.
   */
  const handleDelete = (): void => {
    if (!exerciseToEdit) return;

    deleteExerciseAndRepairReferences(exerciseToEdit);
    navigateBack({ deletedExerciseId: exerciseToEdit.id });
  };

  const saveButton = (
    <button
      type="submit"
      form="exercise-form"
      className="btn btn-primary page-header-save-btn"
      disabled={!name.trim()}
    >
      <Save size={18} />
      {exerciseToEdit ? "Save" : "Add"}
    </button>
  );

  return (
    <div className="exercise-form-page">
      <PageHeader title={exerciseToEdit ? "Edit Exercise" : "New Exercise"} actions={saveButton} />

      <div className="exercise-form-content">
        <form id="exercise-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bench Press"
              autoFocus={!isDefaultExercise}
              required
              disabled={isDefaultExercise}
              className={disabledFieldClassName}
            />
          </div>

          <div className="form-group">
            <label htmlFor="exerciseType" className="form-label">
              Exercise Type
            </label>
            <select
              id="exerciseType"
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
              disabled={isDefaultExercise}
              className={disabledFieldClassName}
            >
              {EXERCISE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {exerciseTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="muscleGroup" className="form-label">
              Muscle Group
            </label>
            <select
              id="muscleGroup"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
              disabled={isDefaultExercise}
              className={disabledFieldClassName}
            >
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {muscleGroupLabels[group]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tips, cues, or variations..."
              rows={3}
              autoFocus={isDefaultExercise}
            />
          </div>

          {exerciseToEdit && (
            <button type="button" className="btn btn-danger btn-full" onClick={handleDelete}>
              <Trash2 size={18} />
              Delete Exercise
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
