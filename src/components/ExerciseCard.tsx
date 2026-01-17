import { Clock, Edit3 } from "lucide-react";

import type { Exercise } from "../types";
import { exerciseTypeLabels, muscleGroupLabels, getMuscleGroupClassName } from "../types";

import "./ExerciseCard.css";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
  onEdit?: () => void;
  isDefault?: boolean;
  lastPerformed?: string | null;
}

export function ExerciseCard({
  exercise,
  onClick,
  onEdit,
  isDefault = false,
  lastPerformed,
}: ExerciseCardProps) {
  /**
   * Handles edit button click. Stops propagation to prevent card's onClick
   * from triggering when the edit button is clicked.
   *
   * @param event - The mouse event
   */
  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit?.();
  };

  return (
    <div className="exercise-card card" onClick={onClick}>
      <div className="exercise-card-header">
        <h3 className="exercise-name">{exercise.name}</h3>
        {onEdit && (
          <button
            className="btn btn-icon btn-ghost exercise-edit-btn"
            onClick={handleEditClick}
            aria-label="Edit exercise"
          >
            <Edit3 size={16} />
          </button>
        )}
      </div>
      <div className="exercise-card-meta">
        <span className={`tag ${getMuscleGroupClassName(exercise.muscleGroup)}`}>
          {muscleGroupLabels[exercise.muscleGroup]}
        </span>
        <span className="tag tag-muted">{exerciseTypeLabels[exercise.exerciseType]}</span>
        {isDefault && <span className="tag tag-default">Default</span>}
      </div>
      {lastPerformed && (
        <div className="exercise-last-performed">
          <Clock size={14} />
          <span>Last performed {lastPerformed}</span>
        </div>
      )}
      {exercise.notes && <p className="exercise-notes">{exercise.notes}</p>}
    </div>
  );
}
