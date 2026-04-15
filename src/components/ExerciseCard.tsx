import { useEffect, useRef, useState } from "react";
import { Clock, MoreVertical, Pencil } from "lucide-react";

import type { Exercise } from "../types";
import { exerciseTypeLabels, muscleGroupLabels } from "../types";

import { Tag } from "./Tag";

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
}: ExerciseCardProps): React.ReactElement {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  /**
   * Handles edit menu click. Stops propagation to prevent card's onClick
   * from triggering when the menu action is clicked.
   *
   * @param event - The mouse event
   */
  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMenuOpen(false);
    onEdit?.();
  };

  return (
    <div className="exercise-card card" onClick={onClick}>
      {onEdit && (
        <div className="exercise-card-menu" ref={menuRef}>
          <button
            type="button"
            className="btn btn-ghost btn-icon exercise-menu-btn"
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((currentValue) => !currentValue);
            }}
            aria-label="Exercise options"
            aria-expanded={isMenuOpen}
          >
            <MoreVertical size={16} />
          </button>
          {isMenuOpen && (
            <div className="exercise-menu-dropdown">
              <button type="button" className="exercise-menu-item" onClick={handleEditClick}>
                <Pencil size={16} />
                Edit exercise
              </button>
            </div>
          )}
        </div>
      )}
      <div className="exercise-card-meta">
        <Tag muscleGroup={exercise.muscleGroup}>{muscleGroupLabels[exercise.muscleGroup]}</Tag>
        <Tag>{exerciseTypeLabels[exercise.exerciseType]}</Tag>
        {isDefault && <Tag variant="default">Default</Tag>}
      </div>
      <div className="exercise-card-header">
        <h3 className="exercise-name">{exercise.name}</h3>
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
