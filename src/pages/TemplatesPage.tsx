import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, MoreVertical, Pencil } from "lucide-react";

import type { Workout, WorkoutTemplate, WorkoutExercise, MuscleGroup } from "../types";
import { muscleGroupLabels } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  STORAGE_KEYS,
  generateId,
  normalizeTemplates,
  normalizeActiveWorkout,
  getDraftTemplate,
  saveDraftTemplate,
} from "../utils/storage";

import { DraftBanner } from "../components/DraftBanner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { Tag } from "../components/Tag";

import "./TemplatesPage.css";

export function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, [], {
    deserialize: normalizeTemplates,
  });
  const [activeWorkout, setActiveWorkout] = useLocalStorage<Workout | null>(
    STORAGE_KEYS.ACTIVE_WORKOUT,
    null,
    {
      deserialize: normalizeActiveWorkout,
    }
  );

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const { showConfirm, dialogProps } = useConfirmDialog();

  useEffect(() => {
    setHasDraft(getDraftTemplate() !== null);
  }, []);

  const handleCreateTemplate = () => {
    if (getDraftTemplate()) {
      showConfirm({
        title: "Discard unsaved draft?",
        message:
          "You have an unsaved template draft. Do you want to discard it and start a new template?",
        confirmText: "Discard",
        cancelText: "Cancel",
        variant: "danger",
        onConfirm: () => {
          saveDraftTemplate(null);
          setHasDraft(false);
          navigate("/templates/new");
        },
      });
    } else {
      navigate("/templates/new");
    }
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/templates/edit/${templateId}`);
  };

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

  const handleContinueDraft = () => {
    navigate("/templates/new");
  };

  const handleDismissDraft = () => {
    showConfirm({
      title: "Discard draft template?",
      message: "This action cannot be undone.",
      confirmText: "Discard",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: () => {
        saveDraftTemplate(null);
        setHasDraft(false);
      },
    });
  };

  const handleStartTemplate = (template: WorkoutTemplate) => {
    const today = new Date();
    const workoutExercises: WorkoutExercise[] = [];

    template.muscleGroups.forEach((muscleGroup) => {
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
            intensityTechnique: templateExercise.intensityTechnique ?? null,
            supersetGroupId: templateExercise.supersetGroupId ?? null,
          });
        }
      });
    });

    const newWorkout: Workout = {
      id: generateId(),
      name: template.name,
      date: today.toISOString(),
      startTime: today.toISOString(),
      exercises: workoutExercises,
      completed: false,
      templateId: template.id,
    };

    setActiveWorkout(newWorkout);
    navigate("/workout");
  };

  const confirmStartTemplate = (template: WorkoutTemplate) => {
    const isReplacingActiveWorkout = activeWorkout !== null;

    showConfirm({
      title: isReplacingActiveWorkout ? "Replace active workout?" : `Start "${template.name}"?`,
      message: isReplacingActiveWorkout
        ? "You have an active workout in progress. Starting this template will replace it. Do you want to continue?"
        : "This will begin a new workout from this template.",
      confirmText: isReplacingActiveWorkout ? "Replace and start" : "Start",
      cancelText: "Cancel",
      variant: isReplacingActiveWorkout ? "danger" : "standard",
      onConfirm: () => handleStartTemplate(template),
    });
  };

  const getTemplateMuscleGroups = (template: WorkoutTemplate): MuscleGroup[] => {
    return Array.from(new Set(template.muscleGroups.map((mg) => mg.muscleGroup)));
  };

  const getTemplateStats = (template: WorkoutTemplate) => {
    let exerciseCount = 0;
    let setCount = 0;

    template.muscleGroups.forEach((muscleGroup) => {
      muscleGroup.exercises.forEach((exercise) => {
        if (exercise.exerciseId) {
          exerciseCount++;
          setCount += exercise.setCount;
        }
      });
    });

    return { exerciseCount, setCount };
  };

  const toggleMenu = (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === templateId ? null : templateId);
  };

  const handleClickOutside = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest(".template-kebab-menu")) return;
    setOpenMenuId(null);
  };

  return (
    <div className="page templates-page" onClick={handleClickOutside}>
      <PageHeader
        title="Templates"
        showBackButton={false}
        actions={
          <button
            type="button"
            className="btn btn-icon page-header-action"
            onClick={handleCreateTemplate}
            aria-label="Create new template"
          >
            <Plus size={20} />
          </button>
        }
      />

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
            const muscleGroups = getTemplateMuscleGroups(template);

            return (
              <div key={template.id} className="template-card card">
                <button
                  type="button"
                  className="template-card-clickable"
                  onClick={() => confirmStartTemplate(template)}
                >
                  <div className="template-card-content">
                    <div className="template-card-meta">
                      {muscleGroups.map((mg) => (
                        <Tag key={mg} muscleGroup={mg}>
                          {muscleGroupLabels[mg]}
                        </Tag>
                      ))}
                    </div>
                    <h2 className="template-card-name">{template.name}</h2>
                    <div className="template-card-tags">
                      {stats.exerciseCount > 0 && (
                        <Tag>
                          {stats.exerciseCount} EXERCISE{stats.exerciseCount !== 1 ? "S" : ""}
                        </Tag>
                      )}
                      {stats.setCount > 0 && <Tag>{stats.setCount} SETS</Tag>}
                    </div>
                  </div>
                </button>

                <div className="template-kebab-menu">
                  <button
                    className="btn btn-ghost btn-icon template-row-menu-btn"
                    onClick={(event) => toggleMenu(template.id, event)}
                    aria-label="More options"
                    aria-expanded={openMenuId === template.id}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openMenuId === template.id && (
                    <div className="template-kebab-dropdown">
                      <button
                        className="template-kebab-item"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(null);
                          handleEditTemplate(template.id);
                        }}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button
                        className="template-kebab-item template-kebab-item-delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(null);
                          deleteTemplate(template.id);
                        }}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  )}
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
