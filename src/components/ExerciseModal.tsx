import { useState, useEffect } from "react";
import { X } from "lucide-react";

import type { Exercise, MuscleGroup, ExerciseType } from "../types";

import "./ExerciseModal.css";

interface ExerciseModalProps {
  exercise: Exercise | null;
  onSave: (data: Omit<Exercise, "id">) => void;
  onClose: () => void;
  onDelete?: () => void;
  muscleGroups: MuscleGroup[];
  exerciseTypes: ExerciseType[];
  muscleGroupLabels: Record<MuscleGroup, string>;
  exerciseTypeLabels: Record<ExerciseType, string>;
}

export function ExerciseModal({
  exercise,
  onSave,
  onClose,
  onDelete,
  muscleGroups,
  exerciseTypes,
  muscleGroupLabels,
  exerciseTypeLabels,
}: ExerciseModalProps) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(exercise?.muscleGroup ?? "chest");
  const [exerciseType, setExerciseType] = useState<ExerciseType>(
    exercise?.exerciseType ?? "barbell"
  );
  const [notes, setNotes] = useState(exercise?.notes ?? "");

  // Check if this is a default exercise (not yet overridden by user)
  const isDefaultExercise = exercise?.id.startsWith("default-") ?? false;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /**
   * Handles form submission. Validates that the name is not empty,
   * then calls onSave with the trimmed exercise data.
   *
   * @param event - The form submit event
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), muscleGroup, exerciseType, notes: notes.trim() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{exercise ? "Edit Exercise" : "New Exercise"}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
                {exerciseTypes.map((type) => (
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
                {muscleGroups.map((group) => (
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
          </div>

          <div className="modal-footer">
            {exercise && onDelete && (
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                Delete
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              {exercise ? "Save" : "Add Exercise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
