import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, ChevronLeft, Minus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

import type { Exercise, WorkoutTemplate, TemplateExercise, TemplateMuscleGroup } from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  STORAGE_KEYS,
  generateId,
  DEFAULT_EXERCISES,
  normalizeTemplates,
  getDraftTemplate,
  saveDraftTemplate,
} from "../utils/storage";

import "./TemplateEditorPage.css";

interface TemplateSelectionTarget {
  templateExerciseId: string;
}

function flattenTemplateMuscleGroups(muscleGroups: TemplateMuscleGroup[]): TemplateExercise[] {
  return muscleGroups.flatMap((muscleGroup) =>
    muscleGroup.exercises.map((exercise) => ({ ...exercise }))
  );
}

function buildTemplateMuscleGroups(
  templateExercises: TemplateExercise[],
  exercises: Exercise[]
): TemplateMuscleGroup[] {
  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const muscleGroups: TemplateMuscleGroup[] = [];

  templateExercises.forEach((templateExercise) => {
    if (!templateExercise.exerciseId) return;

    const exercise = exercisesById.get(templateExercise.exerciseId);
    if (!exercise) return;

    const previousGroup = muscleGroups[muscleGroups.length - 1];

    if (previousGroup && previousGroup.muscleGroup === exercise.muscleGroup) {
      previousGroup.exercises.push({ ...templateExercise });
      return;
    }

    muscleGroups.push({
      id: generateId(),
      muscleGroup: exercise.muscleGroup,
      exercises: [{ ...templateExercise }],
    });
  });

  return muscleGroups;
}

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;

  const [exercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, [], {
    deserialize: normalizeTemplates,
  });

  const [name, setName] = useState("");
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = exercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(exercises.filter((exercise) => !exercise.id.startsWith("default-")));

  useEffect(() => {
    if (isEditMode) {
      const template = templates.find((item) => item.id === id);
      if (template) {
        setName(template.name);
        setTemplateExercises(flattenTemplateMuscleGroups(template.muscleGroups));
      } else {
        navigate("/templates", { replace: true });
      }
    } else {
      const draft = getDraftTemplate();
      if (draft) {
        setName(draft.name);
        setTemplateExercises(draft.exercises);
      }
    }

    setIsInitialized(true);
  }, [id, isEditMode, navigate, templates]);

  useEffect(() => {
    if (!isEditMode && isInitialized) {
      saveDraftTemplate({ name, exercises: templateExercises });
    }
  }, [isEditMode, isInitialized, name, templateExercises]);

  useEffect(() => {
    if (!location.state) return;

    const state = location.state as {
      selectedExerciseId?: string;
      appendTemplateExercise?: boolean;
      templateSelectionTarget?: TemplateSelectionTarget;
    };

    if (state.selectedExerciseId && state.templateSelectionTarget) {
      navigate(location.pathname, { replace: true, state: {} });

      const { templateExerciseId } = state.templateSelectionTarget;

      setTemplateExercises((previous) =>
        previous.map((exercise) =>
          exercise.id === templateExerciseId
            ? { ...exercise, exerciseId: state.selectedExerciseId! }
            : exercise
        )
      );

      setError("");
      return;
    }

    if (state.selectedExerciseId && state.appendTemplateExercise) {
      navigate(location.pathname, { replace: true, state: {} });

      setTemplateExercises((previous) => [
        ...previous,
        {
          id: generateId(),
          exerciseId: state.selectedExerciseId!,
          setCount: 3,
        },
      ]);

      setError("");
    }
  }, [location.pathname, location.state, navigate]);

  const handleBack = () => {
    navigate("/templates");
  };

  const saveTemplate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Please enter a template name");
      setError("");
      nameInputRef.current?.focus();
      return;
    }

    setNameError("");

    const hasExercises = templateExercises.some((exercise) => exercise.exerciseId !== null);

    if (!hasExercises) {
      setError("Please add at least one exercise to the template");
      return;
    }

    const cleanedExercises = templateExercises.filter((exercise) => exercise.exerciseId !== null);

    const savedTemplate: WorkoutTemplate = {
      id: isEditMode ? id! : generateId(),
      name: trimmedName,
      muscleGroups: buildTemplateMuscleGroups(cleanedExercises, allExercises),
    };

    const existingIndex = templates.findIndex((template) => template.id === savedTemplate.id);
    if (existingIndex >= 0) {
      const updated = [...templates];
      updated[existingIndex] = savedTemplate;
      setTemplates(updated);
    } else {
      setTemplates([savedTemplate, ...templates]);
    }

    if (!isEditMode) {
      saveDraftTemplate(null);
    }

    navigate("/templates");
  };

  const handleAddExercise = () => {
    const path = isEditMode
      ? `/templates/edit/${id}/select-exercise`
      : "/templates/new/select-exercise";
    navigate(path, {
      state: {
        exercises: allExercises,
        appendTemplateExercise: true,
      },
    });
  };

  const removeExercise = (templateExerciseId: string) => {
    setTemplateExercises((previous) =>
      previous.filter((exercise) => exercise.id !== templateExerciseId)
    );
  };

  const moveExercise = (templateExerciseId: string, direction: "up" | "down") => {
    setTemplateExercises((previous) => {
      const currentIndex = previous.findIndex((exercise) => exercise.id === templateExerciseId);
      if (currentIndex === -1) return previous;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= previous.length) return previous;

      const reordered = [...previous];
      [reordered[currentIndex], reordered[newIndex]] = [
        reordered[newIndex],
        reordered[currentIndex],
      ];
      return reordered;
    });
  };

  const handleSelectExercise = (templateExerciseId: string) => {
    const path = isEditMode
      ? `/templates/edit/${id}/select-exercise`
      : "/templates/new/select-exercise";
    const templateExercise = templateExercises.find(
      (exercise) => exercise.id === templateExerciseId
    );
    const currentExercise = getExerciseById(templateExercise?.exerciseId ?? null);

    navigate(path, {
      state: {
        exercises: allExercises,
        initialMuscleGroup: currentExercise?.muscleGroup,
        templateUpdateChecked: true,
        templateSelectionTarget: {
          templateExerciseId,
        },
      },
    });
  };

  const getExerciseById = (exerciseId: string | null) => {
    if (!exerciseId) return null;
    return allExercises.find((exercise) => exercise.id === exerciseId) ?? null;
  };

  const updateSetCount = (templateExerciseId: string, delta: number) => {
    setTemplateExercises((previous) =>
      previous.map((exercise) => {
        if (exercise.id !== templateExerciseId) return exercise;
        const newCount = Math.max(1, Math.min(20, exercise.setCount + delta));
        return { ...exercise, setCount: newCount };
      })
    );
  };

  return (
    <div className="page templates-page-editor">
      <div className="templates-editor-header">
        <button className="btn btn-icon btn-ghost" onClick={handleBack} aria-label="Go back">
          <ChevronLeft size={24} />
          Back
        </button>
      </div>

      <div className="templates-title-section">
        <input
          ref={nameInputRef}
          type="text"
          className={`templates-name-input ${nameError ? "is-invalid" : ""}`}
          placeholder="Upper body workout"
          value={name}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "template-name-error" : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setNameError("");
            setError("");
          }}
        />
        {nameError && (
          <p id="template-name-error" className="templates-name-error" role="alert">
            {nameError}
          </p>
        )}
      </div>

      <div className="templates-day-content">
        {templateExercises.length === 0 ? (
          <div className="templates-empty-day">
            <p>No exercises added yet.</p>
            <p className="hint">Tap the + button to add exercises straight to this template.</p>
          </div>
        ) : (
          <div className="templates-exercises-list">
            {templateExercises.map((templateExercise, exerciseIndex) => {
              const exercise = getExerciseById(templateExercise.exerciseId);

              return (
                <div key={templateExercise.id} className="templates-exercise-item">
                  <div className="templates-exercise-reorder">
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => moveExercise(templateExercise.id, "up")}
                      disabled={exerciseIndex === 0}
                      aria-label="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => moveExercise(templateExercise.id, "down")}
                      disabled={exerciseIndex === templateExercises.length - 1}
                      aria-label="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div className="templates-exercise-content">
                    {exercise && (
                      <div className="templates-exercise-meta">
                        <span
                          className="templates-exercise-muscle-chip"
                          style={
                            {
                              "--exercise-muscle-color": muscleGroupColors[exercise.muscleGroup],
                            } as CSSProperties
                          }
                        >
                          {muscleGroupLabels[exercise.muscleGroup]}
                        </span>
                      </div>
                    )}

                    <div
                      className={`templates-exercise-row ${exercise ? "has-selected-exercise" : ""}`}
                    >
                      <button
                        className={`templates-exercise-btn ${exercise ? "has-exercise" : ""}`}
                        onClick={() => handleSelectExercise(templateExercise.id)}
                      >
                        {exercise ? exercise.name : "Choose an exercise"}
                      </button>
                      {exercise && (
                        <div className="templates-set-count-control">
                          <button
                            type="button"
                            className="btn btn-icon btn-ghost btn-sm"
                            onClick={() => updateSetCount(templateExercise.id, -1)}
                            disabled={templateExercise.setCount <= 1}
                            aria-label="Decrease sets"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="templates-set-count-value">
                            {templateExercise.setCount}
                          </span>
                          <button
                            type="button"
                            className="btn btn-icon btn-ghost btn-sm"
                            onClick={() => updateSetCount(templateExercise.id, 1)}
                            disabled={templateExercise.setCount >= 20}
                            aria-label="Increase sets"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-icon btn-ghost templates-exercise-delete"
                    onClick={() => removeExercise(templateExercise.id)}
                    aria-label="Remove exercise"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="templates-error">{error}</p>}

      <div className="templates-editor-footer">
        <button
          type="button"
          className="btn btn-icon templates-fab"
          onClick={handleAddExercise}
          aria-label="Add exercise"
        >
          <Plus size={24} />
        </button>

        <button className="btn btn-accent templates-save-btn text-uppercase" onClick={saveTemplate}>
          {isEditMode ? "Save Changes" : "Create Template"}
        </button>
      </div>
    </div>
  );
}
