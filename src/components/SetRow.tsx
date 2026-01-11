import { useState, useEffect, useRef } from "react";
import { MoreVertical, Trash2, Check } from "lucide-react";

import type { WorkoutSet, ExerciseType } from "../types";

import "./SetRow.css";

interface SetRowProps {
  set: WorkoutSet;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onRemove: () => void;
  canRemove: boolean;
  exerciseType: ExerciseType;
  placeholderWeight?: number;
  placeholderReps?: number;
}

export function SetRow({
  set,
  onUpdate,
  onRemove,
  canRemove,
  exerciseType,
  placeholderWeight,
  placeholderReps,
}: SetRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isBodyweight = exerciseType === "bodyweight";

  /**
   * Checks if the set has valid data for completion.
   * For bodyweight exercises: reps must be > 0
   * For weighted exercises: both weight and reps must be > 0
   */
  const canComplete = isBodyweight ? set.reps > 0 : set.weight > 0 && set.reps > 0;

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  /**
   * Handles deleting the set. Only proceeds if canRemove is true.
   * Closes the menu after deletion.
   */
  const handleDelete = () => {
    if (canRemove) {
      onRemove();
      setMenuOpen(false);
    }
  };

  return (
    <div
      className={`set-row ${set.completed ? "completed" : ""} ${isBodyweight ? "bodyweight" : ""}`}
    >
      <div className="set-menu" ref={menuRef}>
        <button
          className="set-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Set options"
          aria-expanded={menuOpen}
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="set-menu-dropdown">
            <button className="set-menu-item danger" onClick={handleDelete} disabled={!canRemove}>
              <Trash2 size={16} />
              Delete set
            </button>
          </div>
        )}
      </div>
      {!isBodyweight && (
        <div className="set-weight">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={set.weight || ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              onUpdate({ weight: !isNaN(value) && value >= 0 ? value : 0 });
            }}
            placeholder={placeholderWeight ? `${placeholderWeight}` : "lbs"}
            disabled={set.completed}
          />
        </div>
      )}
      <div className="set-reps">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={set.reps || ""}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            onUpdate({ reps: !isNaN(value) && value >= 0 ? value : 0 });
          }}
          placeholder={placeholderReps ? `${placeholderReps}` : "0"}
          disabled={set.completed}
        />
      </div>
      <div className="set-done">
        <button
          className={`checkbox ${set.completed ? "checked" : ""}`}
          onClick={() => {
            if (set.completed || canComplete) {
              onUpdate({ completed: !set.completed });
            }
          }}
          disabled={!set.completed && !canComplete}
          aria-label={set.completed ? "Mark incomplete" : "Mark complete"}
        >
          <Check size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
