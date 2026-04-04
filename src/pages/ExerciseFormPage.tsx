import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";

import type { Exercise, MuscleGroup, ExerciseType } from "../types";
import { MUSCLE_GROUPS, EXERCISE_TYPES, muscleGroupLabels, exerciseTypeLabels } from "../types";

import { getExercises, DEFAULT_EXERCISES } from "../utils/storage";

import { PageHeader } from "../components/PageHeader";

import "./ExerciseFormPage.css";

export function ExerciseFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exerciseId } = useParams();

  // Get exercise to edit (either from URL param or location state)
  let exerciseToEdit: Exercise | null = null;
  if (exerciseId) {
    const userExercises = getExercises();
    const allExercises = [...DEFAULT_EXERCISES, ...userExercises];
    exerciseToEdit = allExercises.find((ex) => ex.id === exerciseId) || null;
  } else if (location.state?.exercise) {
    exerciseToEdit = location.state.exercise as Exercise;
  }

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

  /**
   * Handles form submission. Validates that the name is not empty,
   * then navigates back with the exercise data.
   *
   * @param event - The form submit event
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const exerciseData = {
      name: name.trim(),
      muscleGroup,
      exerciseType,
      notes: notes.trim(),
    };

    navigate("..", {
      state: { savedExercise: exerciseData, exerciseId: exerciseToEdit?.id },
      relative: "path",
    });
  };

  /**
   * Handles deleting an exercise. Navigates back with the exercise ID
   * to trigger deletion in the parent component.
   */
  const handleDelete = () => {
    if (!exerciseToEdit) return;
    navigate("..", {
      state: { deletedExerciseId: exerciseToEdit.id },
      relative: "path",
    });
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
              className={isDefaultExercise ? "disabled-field" : ""}
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
              className={isDefaultExercise ? "disabled-field" : ""}
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
              className={isDefaultExercise ? "disabled-field" : ""}
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
