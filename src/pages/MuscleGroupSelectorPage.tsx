import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check } from "lucide-react";

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
  const location = useLocation();

  const state = location.state as { existingMuscleGroups?: MuscleGroup[] } | null;
  const existingMuscleGroups = state?.existingMuscleGroups ?? [];

  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>([]);

  /**
   * Toggles the selection state of a muscle group.
   * Adds the group if not selected, removes it if already selected.
   *
   * @param group - The muscle group to toggle
   */
  const toggleSelection = (group: MuscleGroup) => {
    setSelectedGroups((prev) => {
      if (prev.includes(group)) {
        return prev.filter((g) => g !== group);
      } else {
        return [...prev, group];
      }
    });
  };

  /**
   * Toggles selection of all muscle groups in a category.
   * If all groups are selected, deselects them. Otherwise, selects all.
   *
   * @param categoryGroups - Array of muscle groups in the category
   */
  const handleSelectAll = (categoryGroups: MuscleGroup[]) => {
    setSelectedGroups((prev) => {
      // Check if all groups in this category are already selected
      const allSelected = categoryGroups.every((g) => prev.includes(g));

      if (allSelected) {
        // Deselect all groups from this category
        return prev.filter((g) => !categoryGroups.includes(g));
      } else {
        // Select all groups from this category that aren't already selected
        const newGroups = categoryGroups.filter((g) => !prev.includes(g));
        return [...prev, ...newGroups];
      }
    });
  };

  /**
   * Checks if all muscle groups in a category are selected.
   *
   * @param categoryGroups - Array of muscle groups in the category
   * @returns True if all groups are selected
   */
  const areAllSelected = (categoryGroups: MuscleGroup[]): boolean => {
    return categoryGroups.every((g) => selectedGroups.includes(g));
  };

  /**
   * Checks if a muscle group is already added to the current day.
   *
   * @param group - The muscle group to check
   * @returns True if the group is already added
   */
  const isAlreadyAdded = (group: MuscleGroup): boolean => {
    return existingMuscleGroups.includes(group);
  };

  /**
   * Confirms the selection and navigates back with selected muscle groups.
   */
  const handleConfirm = () => {
    navigate("..", { state: { selectedMuscleGroups: selectedGroups }, relative: "path" });
  };

  return (
    <div className="muscle-group-selector-page">
      <PageHeader title="Select Muscle Groups" />
      <div className="muscle-group-list">
        {MUSCLE_GROUP_CATEGORIES.map((category) => (
          <div key={category.label} className="muscle-group-category">
            <div className="muscle-group-category-header">
              <h3 className="muscle-group-category-title">{category.label}</h3>
              <button
                className="btn btn-ghost btn-sm btn-select-all"
                onClick={() => handleSelectAll(category.groups)}
              >
                {areAllSelected(category.groups) ? "Deselect All" : "Select All"}
              </button>
            </div>
            {category.groups.map((group) => {
              const isSelected = selectedGroups.includes(group);
              const alreadyAdded = isAlreadyAdded(group);

              return (
                <button
                  key={group}
                  className={`muscle-group-option ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleSelection(group)}
                >
                  <div className="muscle-group-option-content">
                    <span
                      className="muscle-group-indicator"
                      style={{ backgroundColor: muscleGroupColors[group] }}
                    />
                    <span className="muscle-group-name">{muscleGroupLabels[group]}</span>
                    {alreadyAdded && <span className="already-added-badge">Added</span>}
                  </div>
                  <span className={`checkmark-icon ${isSelected ? "visible" : ""}`}>
                    <Check size={20} />
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="muscle-group-selector-footer">
        <button
          className="btn btn-accent btn-add-muscle-groups text-uppercase"
          onClick={handleConfirm}
          disabled={selectedGroups.length === 0}
        >
          {selectedGroups.length === 1
            ? "Add Muscle Group"
            : `Add ${selectedGroups.length} Muscle Groups`}
        </button>
      </div>
    </div>
  );
}
