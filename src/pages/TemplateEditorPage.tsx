import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, Minus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

import type {
  Exercise,
  WorkoutTemplate,
  TemplateExercise,
  TemplateMuscleGroup,
  WorkoutTemplateDraft,
} from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAutoFitText } from "../hooks/useAutoFitText";
import { PageHeader } from "../components/PageHeader";
import {
  STORAGE_KEYS,
  generateId,
  DEFAULT_EXERCISES,
  normalizeTemplates,
  getDraftTemplate,
  getEditTemplateDraft,
  saveDraftTemplate,
  saveEditTemplateDraft,
} from "../utils/storage";

import "./TemplateEditorPage.css";

interface TemplateSelectionTarget {
  templateExerciseId: string;
}

interface TemplateEditorLocationState {
  selectedExerciseId?: string;
  appendTemplateExercise?: boolean;
  templateSelectionTarget?: TemplateSelectionTarget;
  templateDraft?: WorkoutTemplateDraft;
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

type TemplateExercisesAction =
  | {
      type: "replaceExercise";
      templateExerciseId: string;
      exerciseId: string;
    }
  | {
      type: "appendExercise";
      templateExercise: TemplateExercise;
    }
  | {
      type: "removeExercise";
      templateExerciseId: string;
    }
  | {
      type: "moveExercise";
      templateExerciseId: string;
      direction: "up" | "down";
    }
  | {
      type: "updateSetCount";
      templateExerciseId: string;
      delta: number;
    };

function templateExercisesReducer(
  state: TemplateExercise[],
  action: TemplateExercisesAction
): TemplateExercise[] {
  switch (action.type) {
    case "replaceExercise":
      return state.map((exercise) =>
        exercise.id === action.templateExerciseId
          ? { ...exercise, exerciseId: action.exerciseId }
          : exercise
      );

    case "appendExercise":
      return [...state, action.templateExercise];

    case "removeExercise":
      return state.filter((exercise) => exercise.id !== action.templateExerciseId);

    case "moveExercise": {
      const currentIndex = state.findIndex((exercise) => exercise.id === action.templateExerciseId);
      if (currentIndex === -1) return state;

      const newIndex = action.direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= state.length) return state;

      const reordered = [...state];
      [reordered[currentIndex], reordered[newIndex]] = [
        reordered[newIndex],
        reordered[currentIndex],
      ];
      return reordered;
    }

    case "updateSetCount":
      return state.map((exercise) => {
        if (exercise.id !== action.templateExerciseId) return exercise;

        const setCount = Math.max(1, Math.min(20, exercise.setCount + action.delta));
        return { ...exercise, setCount };
      });

    default:
      return state;
  }
}

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  const locationState = (location.state as TemplateEditorLocationState | null) ?? null;
  const routeDraft = locationState?.templateDraft ?? null;

  const [exercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, [], {
    deserialize: normalizeTemplates,
  });

  const template = isEditMode ? (templates.find((item) => item.id === id) ?? null) : null;
  const persistedEditDraft = isEditMode && id ? getEditTemplateDraft(id) : null;

  const [name, setName] = useState(() => {
    if (routeDraft) {
      return routeDraft.name;
    }

    if (persistedEditDraft) {
      return persistedEditDraft.name;
    }

    if (template) {
      return template.name;
    }

    return getDraftTemplate()?.name ?? "";
  });
  const [templateExercises, dispatchTemplateExercises] = useReducer(
    templateExercisesReducer,
    template,
    (initialTemplate) => {
      if (routeDraft) {
        return routeDraft.exercises;
      }

      if (persistedEditDraft) {
        return persistedEditDraft.exercises;
      }

      if (initialTemplate) {
        return flattenTemplateMuscleGroups(initialTemplate.muscleGroups);
      }

      return getDraftTemplate()?.exercises ?? [];
    }
  );
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const nameInputRef = useAutoFitText<HTMLInputElement>(name || "Enter template name...");
  const handledSelectionRef = useRef<string | null>(null);

  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = exercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(exercises.filter((exercise) => !exercise.id.startsWith("default-")));

  useEffect(() => {
    if (isEditMode && !template) {
      navigate("/templates", { replace: true });
    }
  }, [isEditMode, navigate, template]);

  useEffect(() => {
    if (isEditMode && id) {
      saveEditTemplateDraft(id, { name, exercises: templateExercises });
      return;
    }

    if (!isEditMode) {
      saveDraftTemplate({ name, exercises: templateExercises });
    }
  }, [id, isEditMode, name, templateExercises]);

  useEffect(() => {
    if (!location.state) return;

    const state = location.state as TemplateEditorLocationState;

    const selectionKey = state.selectedExerciseId
      ? `${location.key}:${state.selectedExerciseId}:${state.templateSelectionTarget?.templateExerciseId ?? "append"}`
      : null;

    if (!selectionKey || handledSelectionRef.current === selectionKey) {
      return;
    }

    handledSelectionRef.current = selectionKey;

    if (state.selectedExerciseId && state.templateSelectionTarget) {
      navigate(location.pathname, { replace: true, state: {} });

      dispatchTemplateExercises({
        type: "replaceExercise",
        templateExerciseId: state.templateSelectionTarget.templateExerciseId,
        exerciseId: state.selectedExerciseId,
      });
      return;
    }

    if (state.selectedExerciseId && state.appendTemplateExercise) {
      navigate(location.pathname, { replace: true, state: {} });

      dispatchTemplateExercises({
        type: "appendExercise",
        templateExercise: {
          id: generateId(),
          exerciseId: state.selectedExerciseId,
          setCount: 3,
        },
      });
      return;
    }
  }, [location.key, location.pathname, location.state, navigate]);

  const createDraftSnapshot = (): WorkoutTemplateDraft => ({
    name,
    exercises: templateExercises.map((exercise) => ({ ...exercise })),
  });

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
    } else {
      saveEditTemplateDraft(id!, null);
    }

    navigate("/templates");
  };

  const handleAddExercise = () => {
    setError("");

    const draft = createDraftSnapshot();
    navigate(location.pathname, {
      replace: true,
      state: { templateDraft: draft },
      flushSync: true,
    });

    const path = isEditMode
      ? `/templates/edit/${id}/select-exercise`
      : "/templates/new/select-exercise";
    queueMicrotask(() => {
      navigate(path, {
        state: {
          exercises: allExercises,
          appendTemplateExercise: true,
          templateDraft: draft,
        },
      });
    });
  };

  const removeExercise = (templateExerciseId: string) => {
    dispatchTemplateExercises({ type: "removeExercise", templateExerciseId });
  };

  const moveExercise = (templateExerciseId: string, direction: "up" | "down") => {
    dispatchTemplateExercises({ type: "moveExercise", templateExerciseId, direction });
  };

  const handleSelectExercise = (templateExerciseId: string) => {
    setError("");

    const draft = createDraftSnapshot();
    navigate(location.pathname, {
      replace: true,
      state: { templateDraft: draft },
      flushSync: true,
    });

    const path = isEditMode
      ? `/templates/edit/${id}/select-exercise`
      : "/templates/new/select-exercise";
    const templateExercise = templateExercises.find(
      (exercise) => exercise.id === templateExerciseId
    );
    const currentExercise = getExerciseById(templateExercise?.exerciseId ?? null);

    queueMicrotask(() => {
      navigate(path, {
        state: {
          exercises: allExercises,
          initialMuscleGroup: currentExercise?.muscleGroup,
          templateUpdateChecked: true,
          templateDraft: draft,
          templateSelectionTarget: {
            templateExerciseId,
          },
        },
      });
    });
  };

  const getExerciseById = (exerciseId: string | null) => {
    if (!exerciseId) return null;
    return allExercises.find((exercise) => exercise.id === exerciseId) ?? null;
  };

  const updateSetCount = (templateExerciseId: string, delta: number) => {
    dispatchTemplateExercises({ type: "updateSetCount", templateExerciseId, delta });
  };

  return (
    <div className="page templates-page-editor">
      <PageHeader
        title={
          <input
            ref={nameInputRef}
            type="text"
            className={`templates-header-name-input ${nameError ? "is-invalid" : ""}`}
            placeholder="Enter template name..."
            value={name}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "template-name-error" : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setNameError("");
              setError("");
            }}
          />
        }
      />
      {nameError && (
        <p id="template-name-error" className="templates-name-error" role="alert">
          {nameError}
        </p>
      )}

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
          className="btn btn-secondary templates-add-exercise-btn"
          onClick={handleAddExercise}
        >
          <Plus size={20} />
          Add Exercise
        </button>

        <button className="btn btn-accent templates-save-btn text-uppercase" onClick={saveTemplate}>
          {isEditMode ? "Save Changes" : "Create Template"}
        </button>
      </div>
    </div>
  );
}
