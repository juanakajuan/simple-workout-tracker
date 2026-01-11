import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

import type { TemplateDay } from "../types";

import { generateId } from "../utils/storage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

import { ConfirmDialog } from "./ConfirmDialog";

import "./DayEditor.css";

interface DayEditorProps {
  days: TemplateDay[];
  activeDayIndex: number;
  onSave: (days: TemplateDay[], newActiveDayIndex: number) => void;
  onClose: () => void;
}

export function DayEditor({ days, activeDayIndex, onSave, onClose }: DayEditorProps) {
  // Ensure days are numbered sequentially when modal opens
  const renumberedDays = days.map((day, i) => ({
    ...day,
    name: `Day ${i + 1}`,
  }));

  const [localDays, setLocalDays] = useState<TemplateDay[]>(renumberedDays);
  const [localActiveDayIndex, setLocalActiveDayIndex] = useState(activeDayIndex);
  const { showConfirm, dialogProps } = useConfirmDialog();

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
   * Saves the changes and closes the modal.
   */
  const handleSave = () => {
    onSave(localDays, localActiveDayIndex);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal day-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Days</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="day-editor-body">
          <div className="day-editor-list">
            {localDays.map((day, index) => {
              const isActive = index === localActiveDayIndex;

              return (
                <div
                  key={day.id}
                  className={`day-editor-row ${isActive ? "active" : ""}`}
                  onClick={() => setLocalActiveDayIndex(index)}
                >
                  <div className="day-editor-content">
                    <span className="day-editor-name">{day.name}</span>
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

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
