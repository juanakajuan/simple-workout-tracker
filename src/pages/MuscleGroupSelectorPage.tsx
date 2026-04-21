import { useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

const TAP_MOVE_THRESHOLD = 10;

interface MuscleGroupSelectorLocationState {
  existingMuscleGroups?: MuscleGroup[];
}

interface TouchGestureState {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export function MuscleGroupSelectorPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as MuscleGroupSelectorLocationState | null;
  const existingMuscleGroups = state?.existingMuscleGroups ?? [];

  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>(existingMuscleGroups);
  const lastTouchInteractionRef = useRef(0);
  const touchGestureRef = useRef<TouchGestureState | null>(null);
  const selectedGroupSet = new Set(selectedGroups);
  const existingGroupSet = new Set(existingMuscleGroups);

  /**
   * Toggles the selection state of a muscle group.
   * Adds the group if not selected, removes it if already selected.
   *
   * @param group - The muscle group to toggle
   */
  const toggleSelection = (group: MuscleGroup) => {
    setSelectedGroups((prev) => {
      return prev.includes(group) ? prev.filter((selectedGroup) => selectedGroup !== group) : [...prev, group];
    });
  };

  /**
   * Detects synthetic click events fired immediately after a touch interaction.
   *
   * @param timeStamp - Event timestamp from the click event
   * @returns True when the click should be ignored
   */
  const hasRecentTouchInteraction = (timeStamp: number): boolean =>
    timeStamp - lastTouchInteractionRef.current < 500;

  const handleTouchPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return;

    touchGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const handleTouchPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return;

    const gesture = touchGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = Math.abs(event.clientX - gesture.startX);
    const deltaY = Math.abs(event.clientY - gesture.startY);
    if (deltaX > TAP_MOVE_THRESHOLD || deltaY > TAP_MOVE_THRESHOLD) {
      touchGestureRef.current = { ...gesture, moved: true };
    }
  };

  const clearTouchGesture = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return;

    const gesture = touchGestureRef.current;
    if (gesture?.pointerId === event.pointerId) {
      touchGestureRef.current = null;
    }
  };

  /**
   * Finalizes a touch tap and prevents the follow-up synthetic click.
   *
   * @param event - Pointer event for the tap interaction
   * @returns True when the interaction should trigger its action
   */
  const shouldHandleTouchTap = (event: PointerEvent<HTMLButtonElement>): boolean => {
    if (event.pointerType !== "touch") return false;

    const gesture = touchGestureRef.current;
    touchGestureRef.current = null;
    if (!gesture || gesture.pointerId !== event.pointerId || gesture.moved) return false;

    lastTouchInteractionRef.current = event.timeStamp;
    event.preventDefault();
    return true;
  };

  /**
   * Ignores mouse clicks generated from a recent touch interaction.
   *
   * @param event - Mouse event fired by the button
   * @returns True when the click should be ignored
   */
  const shouldIgnoreClickAfterTouch = (event: MouseEvent<HTMLButtonElement>): boolean => {
    return event.detail !== 0 && hasRecentTouchInteraction(event.timeStamp);
  };

  const handleOptionPointerUp = (group: MuscleGroup, event: PointerEvent<HTMLButtonElement>) => {
    if (!shouldHandleTouchTap(event)) return;
    toggleSelection(group);
  };

  const handleOptionClick = (group: MuscleGroup, event: MouseEvent<HTMLButtonElement>) => {
    if (shouldIgnoreClickAfterTouch(event)) return;
    toggleSelection(group);
  };

  /**
   * Toggles selection of all muscle groups in a category.
   * If all groups are selected, deselects them. Otherwise, selects all.
   *
   * @param categoryGroups - Array of muscle groups in the category
   */
  const handleSelectAll = (categoryGroups: MuscleGroup[]) => {
    setSelectedGroups((prev) => {
      const previousGroupSet = new Set(prev);
      const allSelected = categoryGroups.every((group) => previousGroupSet.has(group));

      if (allSelected) {
        return prev.filter((group) => !categoryGroups.includes(group));
      }

      const groupsToAdd = categoryGroups.filter((group) => !previousGroupSet.has(group));
      return [...prev, ...groupsToAdd];
    });
  };

  const handleSelectAllPointerUp = (
    categoryGroups: MuscleGroup[],
    event: PointerEvent<HTMLButtonElement>
  ) => {
    if (!shouldHandleTouchTap(event)) return;
    handleSelectAll(categoryGroups);
  };

  const handleSelectAllClick = (
    categoryGroups: MuscleGroup[],
    event: MouseEvent<HTMLButtonElement>
  ) => {
    if (shouldIgnoreClickAfterTouch(event)) return;
    handleSelectAll(categoryGroups);
  };

  /**
   * Checks if all muscle groups in a category are selected.
   *
   * @param categoryGroups - Array of muscle groups in the category
   * @returns True if all groups are selected
   */
  const areAllSelected = (categoryGroups: MuscleGroup[]): boolean => {
    return categoryGroups.every((group) => selectedGroupSet.has(group));
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
                type="button"
                className="btn btn-ghost btn-sm btn-select-all"
                onPointerDown={handleTouchPointerDown}
                onPointerMove={handleTouchPointerMove}
                onPointerUp={(event) => handleSelectAllPointerUp(category.groups, event)}
                onPointerCancel={clearTouchGesture}
                onClick={(event) => handleSelectAllClick(category.groups, event)}
              >
                {areAllSelected(category.groups) ? "Deselect All" : "Select All"}
              </button>
            </div>
            {category.groups.map((group) => {
              const isSelected = selectedGroupSet.has(group);
              const isExistingGroup = existingGroupSet.has(group);

              return (
                <button
                  type="button"
                  key={group}
                  className={`muscle-group-option ${isSelected ? "selected" : ""}`}
                  onPointerDown={handleTouchPointerDown}
                  onPointerMove={handleTouchPointerMove}
                  onPointerUp={(event) => handleOptionPointerUp(group, event)}
                  onPointerCancel={clearTouchGesture}
                  onClick={(event) => handleOptionClick(group, event)}
                  aria-pressed={isSelected}
                >
                  <div className="muscle-group-option-content">
                    <span
                      className="muscle-group-indicator"
                      style={{ backgroundColor: muscleGroupColors[group] }}
                    />
                    <span className="muscle-group-name">{muscleGroupLabels[group]}</span>
                    {isExistingGroup && <span className="already-added-badge">Added</span>}
                  </div>
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
