import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Trash2, MoreVertical, Dumbbell, Layers3 } from "lucide-react";

import type { Exercise, Workout, WorkoutTemplate, WorkoutExercise } from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  STORAGE_KEYS,
  generateId,
  DEFAULT_EXERCISES,
  normalizeTemplates,
  normalizeActiveWorkout,
  getDraftTemplate,
  saveDraftTemplate,
} from "../utils/storage";

import { DraftBanner } from "../components/DraftBanner";
import { ConfirmDialog } from "../components/ConfirmDialog";

import "./TemplatesPage.css";

export function TemplatesPage() {
  const navigate = useNavigate();
  const [exercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, [], {
    deserialize: normalizeTemplates,
  });
  const [, setActiveWorkout] = useLocalStorage<Workout | null>(STORAGE_KEYS.ACTIVE_WORKOUT, null, {
    deserialize: normalizeActiveWorkout,
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const { showConfirm, dialogProps } = useConfirmDialog();

  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = exercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(exercises.filter((exercise) => !exercise.id.startsWith("default-")));

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

  const handleTemplateClick = (template: WorkoutTemplate) => {
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

  const getExerciseName = (exerciseId: string | null) => {
    if (!exerciseId) return null;
    return allExercises.find((exercise) => exercise.id === exerciseId)?.name ?? null;
  };

  const getExercisePreview = (template: WorkoutTemplate) => {
    return template.muscleGroups
      .flatMap((muscleGroup) =>
        muscleGroup.exercises
          .map((exercise) => {
            const name = getExerciseName(exercise.exerciseId);
            return name ? { id: exercise.id, name } : null;
          })
          .filter((exercise): exercise is { id: string; name: string } => Boolean(exercise))
      )
      .slice(0, 3);
  };

  const getCardStyle = (template: WorkoutTemplate): CSSProperties => {
    const [first = "#fc3d3d", second = "#7c93ff", third = "#22c55e"] = template.muscleGroups.map(
      (muscleGroup) => muscleGroupColors[muscleGroup.muscleGroup]
    );

    return {
      cursor: "pointer",
      "--template-accent-1": first,
      "--template-accent-2": second,
      "--template-accent-3": third,
    } as CSSProperties;
  };

  const toggleMenu = (templateId: string) => {
    setOpenMenuId(openMenuId === templateId ? null : templateId);
  };

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
            const previewExercises = getExercisePreview(template);
            const extraExerciseCount = Math.max(stats.exerciseCount - previewExercises.length, 0);

            return (
              <div
                key={template.id}
                className="template-card card"
                onClick={() => handleEditTemplate(template.id)}
                style={getCardStyle(template)}
              >
                <div className="template-card-hero">
                  <div className="template-card-header">
                    <div className="template-card-info">
                      <span className="template-card-kicker">Workout template</span>
                      <h3 className="template-card-name">{template.name}</h3>
                    </div>
                    <div className="template-kebab-menu">
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={(event) => {
                          event.stopPropagation();
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
                            onClick={(event) => {
                              event.stopPropagation();
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

                  <div className="template-card-stats">
                    <div className="template-stat-pill">
                      <Dumbbell size={15} />
                      <span>
                        {stats.exerciseCount} exercise{stats.exerciseCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="template-stat-pill">
                      <Layers3 size={15} />
                      <span>
                        {stats.setCount} set{stats.setCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="template-card-body">
                  <div className="template-card-muscles">
                    {template.muscleGroups.map((muscleGroup) => (
                      <span key={muscleGroup.id} className="template-card-muscle-chip">
                        <span
                          className="template-card-muscle-dot"
                          style={{ backgroundColor: muscleGroupColors[muscleGroup.muscleGroup] }}
                        />
                        {muscleGroupLabels[muscleGroup.muscleGroup]}
                      </span>
                    ))}
                  </div>

                  <div className="template-card-preview">
                    {previewExercises.map((exercise) => (
                      <span key={exercise.id} className="template-card-preview-item">
                        {exercise.name}
                      </span>
                    ))}
                    {extraExerciseCount > 0 && (
                      <span className="template-card-preview-more">+{extraExerciseCount} more</span>
                    )}
                  </div>
                </div>

                <div className="template-card-actions">
                  <button
                    className="btn btn-primary btn-sm text-uppercase template-card-start"
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
