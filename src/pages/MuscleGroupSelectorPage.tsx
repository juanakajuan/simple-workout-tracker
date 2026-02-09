import { useNavigate } from "react-router-dom";

import type { MuscleGroup } from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { PageHeader } from "../components/PageHeader";

import "./MuscleGroupSelectorPage.css";

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

export function MuscleGroupSelectorPage() {
  const navigate = useNavigate();

  const handleSelect = (muscleGroup: MuscleGroup) => {
    navigate("..", { state: { selectedMuscleGroup: muscleGroup }, relative: "path" });
  };

  return (
    <div className="muscle-group-selector-page">
      <PageHeader title="Select Muscle Group" />
      <div className="muscle-group-list">
        {MUSCLE_GROUP_CATEGORIES.map((category) => (
          <div key={category.label} className="muscle-group-category">
            <h3 className="muscle-group-category-title">{category.label}</h3>
            {category.groups.map((group) => (
              <button
                key={group}
                className="muscle-group-option"
                onClick={() => handleSelect(group)}
              >
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
  );
}
