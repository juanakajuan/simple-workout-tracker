import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Play, Trash2, MoreVertical } from "lucide-react";

import type { Workout, WorkoutTemplate, TemplateDay, WorkoutExercise } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { STORAGE_KEYS, generateId } from "../utils/storage";

import { DraftBanner } from "../components/DraftBanner";
import { ConfirmDialog } from "../components/ConfirmDialog";

import "./TemplatesPage.css";

export function TemplatesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  const [, setActiveWorkout] = useLocalStorage<Workout | null>(STORAGE_KEYS.ACTIVE_WORKOUT, null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const { showConfirm, dialogProps } = useConfirmDialog();

  // Check for draft template on mount
  useEffect(() => {
    const draftExists = localStorage.getItem(STORAGE_KEYS.DRAFT_TEMPLATE) !== null;
    setHasDraft(draftExists);
  }, []);

  // Handle day selection from navigation
  useEffect(() => {
    const state = location.state as {
      selectedDay?: TemplateDay;
      template?: WorkoutTemplate;
    } | null;
    if (state?.selectedDay && state?.template) {
      startFromTemplateDay(state.template, state.selectedDay);
      // Note: Don't clear state here - startFromTemplateDay navigates to /workout
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // ========== Template CRUD ==========

  /**
   * Navigates to the template creation page. If a draft template exists,
   * prompts the user to confirm discarding it before proceeding.
   */
  const handleCreateTemplate = () => {
    // Check if draft exists
    if (localStorage.getItem(STORAGE_KEYS.DRAFT_TEMPLATE)) {
      showConfirm({
        title: "Discard unsaved draft?",
        message:
          "You have an unsaved template draft. Do you want to discard it and start a new template?",
        confirmText: "Discard",
        cancelText: "Cancel",
        variant: "danger",
        onConfirm: () => {
          localStorage.removeItem(STORAGE_KEYS.DRAFT_TEMPLATE);
          setHasDraft(false);
          navigate("/templates/new");
        },
      });
      // If user cancels, do nothing (stay on templates page)
    } else {
      // No draft, proceed normally
      navigate("/templates/new");
    }
  };

  /**
   * Navigates to the template editor page for a specific template.
   *
   * @param templateId - The unique identifier of the template to edit
   */
  const handleEditTemplate = (templateId: string) => {
    navigate(`/templates/edit/${templateId}`);
  };

  /**
   * Deletes a template from localStorage after user confirmation.
   *
   * @param templateId - The unique identifier of the template to delete
   */
  const deleteTemplate = (templateId: string) => {
    showConfirm({
      title: "Delete this template?",
      message: "This action cannot be undone.",
      confirmText: "Send it to the shadow realm",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: () => {
        setTemplates(templates.filter((template) => template.id !== templateId));
      },
    });
  };

  // ========== Draft Management ==========

  /**
   * Navigates to the template editor to continue editing a draft template.
   */
  const handleContinueDraft = () => {
    navigate("/templates/new");
  };

  /**
   * Discards a draft template after user confirmation.
   */
  const handleDismissDraft = () => {
    showConfirm({
      title: "Discard draft template?",
      message: "This action cannot be undone.",
      confirmText: "Discard",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: () => {
        localStorage.removeItem(STORAGE_KEYS.DRAFT_TEMPLATE);
        setHasDraft(false);
      },
    });
  };

  // ========== Workout Start ==========

  /**
   * Handles clicking the start button on a template. For single-day templates,
   * starts the workout immediately. For multi-day templates, shows the day selector.
   *
   * @param template - The workout template to start
   */
  const handleTemplateClick = (template: WorkoutTemplate) => {
    // If template has only one day, start directly
    if (template.days.length === 1) {
      startFromTemplateDay(template, template.days[0]);
    } else {
      // Navigate to day selector for multi-day templates
      navigate("/templates/select-day", {
        state: { template },
      });
    }
  };

  /**
   * Creates and starts a new workout from a template day. Generates workout
   * exercises with the specified number of sets for each exercise. Navigates
   * to the workout page after starting.
   *
   * @param template - The workout template
   * @param day - The specific day within the template to start
   */
  const startFromTemplateDay = (template: WorkoutTemplate, day: TemplateDay) => {
    const today = new Date();

    // Collect all exercises from the day's muscle groups
    const workoutExercises: WorkoutExercise[] = [];
    day.muscleGroups.forEach((muscleGroup) => {
      muscleGroup.exercises.forEach((templateExercise) => {
        if (templateExercise.exerciseId) {
          workoutExercises.push({
            id: generateId(),
            exerciseId: templateExercise.exerciseId,
            sets: Array.from({ length: templateExercise.setCount }, () => ({
              id: generateId(),
              weight: 0,
              reps: 0,
              completed: false,
            })),
          });
        }
      });
    });

    const workoutDisplayName =
      template.days.length > 1 ? `${template.name} - ${day.name}` : template.name;

    const newWorkout: Workout = {
      id: generateId(),
      name: workoutDisplayName,
      date: today.toISOString(),
      startTime: today.toISOString(),
      exercises: workoutExercises,
      completed: false,
      templateId: template.id,
      templateDayId: day.id,
    };

    setActiveWorkout(newWorkout);

    // Navigate to workout page
    navigate("/workout");
  };

  // ========== Template Stats ==========

  /**
   * Calculates statistics for a template including total exercises, total sets,
   * and number of days.
   *
   * @param template - The workout template
   * @returns Object containing exerciseCount, setCount, and dayCount
   */
  const getTemplateStats = (template: WorkoutTemplate) => {
    let exerciseCount = 0;
    let setCount = 0;

    template.days.forEach((day) => {
      day.muscleGroups.forEach((muscleGroup) => {
        muscleGroup.exercises.forEach((exercise) => {
          if (exercise.exerciseId) {
            exerciseCount++;
            setCount += exercise.setCount;
          }
        });
      });
    });

    return { exerciseCount, setCount, dayCount: template.days.length };
  };

  /**
   * Toggles the kebab menu for a template. If the menu is already open,
   * closes it. Otherwise, opens it and closes any other open menu.
   *
   * @param templateId - The unique identifier of the template
   */
  const toggleMenu = (templateId: string) => {
    setOpenMenuId(openMenuId === templateId ? null : templateId);
  };

  /**
   * Closes any open kebab menu when clicking outside of the menu area.
   *
   * @param event - The mouse event
   */
  const handleClickOutside = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest(".template-kebab-menu")) return;
    setOpenMenuId(null);
  };

  return (
    <div className="page templates-page" onClick={handleClickOutside}>
      <header className="page-header">
        <h1 className="page-title">Templates</h1>
        <button className="btn btn-secondary btn-sm text-uppercase" onClick={handleCreateTemplate}>
          <Plus size={16} />
          New
        </button>
      </header>

      {hasDraft && <DraftBanner onContinue={handleContinueDraft} onDismiss={handleDismissDraft} />}

      {templates.length === 0 ? (
        <div className="templates-empty">
          <p>No templates yet.</p>
          <p className="hint">Create one to quickly start workouts.</p>
        </div>
      ) : (
        <div className="templates-list">
          {templates.map((template) => {
            const stats = getTemplateStats(template);

            return (
              <div
                key={template.id}
                className="template-card card"
                onClick={() => handleEditTemplate(template.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="template-card-header">
                  <div className="template-card-info">
                    <h3 className="template-card-name">{template.name}</h3>
                    <span className="template-card-summary">
                      {stats.dayCount > 1 && `${stats.dayCount} days · `}
                      {stats.exerciseCount} exercise{stats.exerciseCount !== 1 ? "s" : ""} ·{" "}
                      {stats.setCount} set{stats.setCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="template-kebab-menu">
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(template.id);
                      }}
                      aria-label="More options"
                      aria-expanded={openMenuId === template.id}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === template.id && (
                      <div className="template-kebab-dropdown">
                        <button
                          className="template-kebab-item template-kebab-item-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            deleteTemplate(template.id);
                          }}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="template-card-actions">
                  <button
                    className="btn btn-primary btn-sm text-uppercase"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleTemplateClick(template);
                    }}
                  >
                    <Play size={16} />
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
