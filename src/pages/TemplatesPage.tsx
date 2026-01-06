import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Trash2, MoreVertical } from "lucide-react";

import type { Workout, WorkoutTemplate, TemplateDay, WorkoutExercise } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS, generateId } from "../utils/storage";

import { DaySelector } from "../components/DaySelector";
import { DraftBanner } from "../components/DraftBanner";

import "./TemplatesPage.css";

export function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  const [, setActiveWorkout] = useLocalStorage<Workout | null>(STORAGE_KEYS.ACTIVE_WORKOUT, null);

  const [showDaySelector, setShowDaySelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Check for draft template on mount
  useEffect(() => {
    const draftExists = localStorage.getItem(STORAGE_KEYS.DRAFT_TEMPLATE) !== null;
    setHasDraft(draftExists);
  }, []);

  // ========== Template CRUD ==========

  const handleCreateTemplate = () => {
    // Check if draft exists
    if (localStorage.getItem(STORAGE_KEYS.DRAFT_TEMPLATE)) {
      if (
        confirm(
          "You have an unsaved template draft. Do you want to discard it and start a new template?"
        )
      ) {
        localStorage.removeItem(STORAGE_KEYS.DRAFT_TEMPLATE);
        setHasDraft(false);
        navigate("/templates/new");
      }
      // If user cancels, do nothing (stay on templates page)
    } else {
      // No draft, proceed normally
      navigate("/templates/new");
    }
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/templates/edit/${templateId}`);
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter((t) => t.id !== templateId));
    }
  };

  // ========== Draft Management ==========

  const handleContinueDraft = () => {
    navigate("/templates/new");
  };

  const handleDismissDraft = () => {
    if (confirm("Are you sure you want to discard this draft template?")) {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_TEMPLATE);
      setHasDraft(false);
    }
  };

  // ========== Workout Start ==========

  const handleTemplateClick = (template: WorkoutTemplate) => {
    // If template has only one day, start directly
    if (template.days.length === 1) {
      startFromTemplateDay(template, template.days[0]);
    } else {
      // Show day selector for multi-day templates
      setSelectedTemplate(template);
      setShowDaySelector(true);
    }
  };

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
    setShowDaySelector(false);
    setSelectedTemplate(null);

    // Navigate to workout page
    navigate("/workout");
  };

  // ========== Template Stats ==========

  const getTemplateStats = (template: WorkoutTemplate) => {
    let exerciseCount = 0;
    let setCount = 0;

    template.days.forEach((day) => {
      day.muscleGroups.forEach((mg) => {
        mg.exercises.forEach((ex) => {
          if (ex.exerciseId) {
            exerciseCount++;
            setCount += ex.setCount;
          }
        });
      });
    });

    return { exerciseCount, setCount, dayCount: template.days.length };
  };

  const toggleMenu = (templateId: string) => {
    setOpenMenuId(openMenuId === templateId ? null : templateId);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".template-kebab-menu")) return;
    setOpenMenuId(null);
  };

  return (
    <div className="page templates-page" onClick={handleClickOutside}>
      <header className="page-header">
        <h1 className="page-title">Templates</h1>
        <button className="btn btn-secondary btn-sm" onClick={handleCreateTemplate}>
          <Plus size={16} />
          NEW
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
                    className="btn btn-primary btn-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleTemplateClick(template);
                    }}
                  >
                    <Play size={16} />
                    START
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDaySelector && selectedTemplate && (
        <DaySelector
          template={selectedTemplate}
          onSelect={(day) => startFromTemplateDay(selectedTemplate, day)}
          onClose={() => {
            setShowDaySelector(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}
