import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, Save } from "lucide-react";

import type { TemplateDay } from "../types";

import { generateId } from "../utils/storage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";

import "./DayEditorPage.css";

interface DayEditorState {
  days: TemplateDay[];
  activeDayIndex: number;
}

export function DayEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as DayEditorState | undefined;

  // Ensure days are numbered sequentially when page opens
  const renumberedDays =
    state?.days.map((day, i) => ({
      ...day,
      name: `Day ${i + 1}`,
    })) || [];

  const [localDays, setLocalDays] = useState<TemplateDay[]>(renumberedDays);
  const [localActiveDayIndex, setLocalActiveDayIndex] = useState(state?.activeDayIndex || 0);
  const { showConfirm, dialogProps } = useConfirmDialog();

  if (!state) {
    navigate("..", { relative: "path" });
    return null;
  }

  /**
   * Adds a new day to the template. Always numbers sequentially.
   */
  const handleAddDay = () => {
    if (localDays.length >= 7) return;

    const newDay: TemplateDay = {
      id: generateId(),
      name: `Day ${localDays.length + 1}`,
      muscleGroups: [],
    };
    setLocalDays([...localDays, newDay]);
  };

  /**
   * Deletes a day from the template and renumbers all remaining days
   * to maintain sequential order (Day 1, Day 2, Day 3, etc.).
   *
   * @param index - The zero-based index of the day to delete
   */
  const handleDeleteDay = (index: number) => {
    if (localDays.length <= 1) return;

    const dayName = localDays[index].name;
    showConfirm({
      title: `Delete "${dayName}"?`,
      message: "This action cannot be undone.",
      confirmText: "Send it to the shadow realm",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: () => {
        // Remove the day at the specified index
        const filteredDays = localDays.filter((_, i) => i !== index);

        // Renumber all remaining days sequentially
        const renumberedDays = filteredDays.map((day, i) => ({
          ...day,
          name: `Day ${i + 1}`,
        }));

        setLocalDays(renumberedDays);

        // Adjust active index if needed
        if (localActiveDayIndex >= renumberedDays.length) {
          setLocalActiveDayIndex(renumberedDays.length - 1);
        } else if (localActiveDayIndex > index) {
          setLocalActiveDayIndex(localActiveDayIndex - 1);
        }
      },
    });
  };

  /**
   * Saves the changes and navigates back.
   */
  const handleSave = () => {
    navigate("..", {
      state: { updatedDays: localDays, updatedActiveDayIndex: localActiveDayIndex },
      relative: "path",
    });
  };

  const saveButton = (
    <button className="btn btn-primary page-header-save-btn" onClick={handleSave}>
      <Save size={18} />
      Save
    </button>
  );

  return (
    <div className="day-editor-page">
      <PageHeader title="Edit Days" actions={saveButton} />

      <div className="day-editor-content">
        <div className="day-editor-list">
          {localDays.map((day, index) => {
            const isActive = index === localActiveDayIndex;

            return (
              <div
                key={day.id}
                className={`day-editor-row ${isActive ? "active" : ""}`}
                onClick={() => setLocalActiveDayIndex(index)}
              >
                <div className="day-editor-content-text">
                  <span className="day-editor-name">{day.name}</span>
                  {isActive && <span className="day-editor-active-badge">Active</span>}
                </div>

                <div className="day-editor-actions">
                  <button
                    className="btn btn-icon btn-ghost btn-sm day-editor-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDay(index);
                    }}
                    disabled={localDays.length <= 1}
                    aria-label="Delete day"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-secondary day-editor-add-btn"
          onClick={handleAddDay}
          disabled={localDays.length >= 7}
        >
          <Plus size={18} />
          Add Day
        </button>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
