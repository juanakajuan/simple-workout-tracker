import { useEffect } from "react";
import { X } from "lucide-react";

import type { MuscleGroup } from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { useSwipeToClose } from "../hooks/useSwipeToClose";

import "./MuscleGroupSelector.css";

interface MuscleGroupSelectorProps {
  onSelect: (muscleGroup: MuscleGroup) => void;
  onClose: () => void;
}

/**
 * Muscle group categories organized by training style.
 * Used to organize the selector UI into logical groupings.
 */
const MUSCLE_GROUP_CATEGORIES: { label: string; groups: MuscleGroup[] }[] = [
  { label: "Upper Push", groups: ["chest", "triceps", "shoulders"] },
  { label: "Upper Pull", groups: ["back", "biceps"] },
  { label: "Legs", groups: ["quads", "glutes", "hamstrings"] },
  { label: "Accessory", groups: ["calves", "traps", "forearms", "abs"] },
];

export function MuscleGroupSelector({ onSelect, onClose }: MuscleGroupSelectorProps) {
  const swipeHandlers = useSwipeToClose(onClose);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="muscle-group-selector-overlay"
      onClick={onClose}
      style={{ opacity: swipeHandlers.overlayOpacity }}
    >
      {/* eslint-disable react-hooks/refs -- False positive: passing ref object, not accessing .current */}
      <div
        ref={swipeHandlers.ref}
        className="muscle-group-selector-modal"
        onClick={(e) => e.stopPropagation()}
        style={swipeHandlers.style}
      >
        {/* eslint-enable react-hooks/refs */}
        <div className="muscle-group-selector-header">
          <h2 className="muscle-group-selector-title">Select Muscle Group</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="muscle-group-list">
          {MUSCLE_GROUP_CATEGORIES.map((category) => (
            <div key={category.label} className="muscle-group-category">
              <h3 className="muscle-group-category-title">{category.label}</h3>
              {category.groups.map((group) => (
                <button key={group} className="muscle-group-option" onClick={() => onSelect(group)}>
                  <span
                    className="muscle-group-indicator"
                    style={{ backgroundColor: muscleGroupColors[group] }}
                  />
                  <span className="muscle-group-name">{muscleGroupLabels[group]}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
