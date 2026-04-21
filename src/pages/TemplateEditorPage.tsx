import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, Minus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

import type {
  Exercise,
  IntensityTechnique,
  WorkoutTemplate,
  TemplateExercise,
  TemplateMuscleGroup,
  WorkoutTemplateDraft,
} from "../types";
import {
  INTENSITY_TECHNIQUES,
  intensityTechniqueLabels,
  muscleGroupLabels,
  muscleGroupColors,
} from "../types";

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
import {
  getSupersetDisplayLabels,
  getSupersetPartnerId,
  pairExercisesAsSuperset,
  removeExerciseWithIntensityCleanup,
  setExerciseIntensityTechnique,
  unpairSupersetExercise,
} from "../utils/intensityTechniques";

import "./TemplateEditorPage.css";

interface TemplateSelectionTarget {
  templateExerciseId: string;
}

interface TemplateEditorLocationState {
  selectedExerciseId?: string;
  appendTemplateExercise?: boolean;
  initialMuscleGroup?: Exercise["muscleGroup"];
  templateSelectionTarget?: TemplateSelectionTarget;
  templateDraft?: WorkoutTemplateDraft;
  templateUpdateChecked?: boolean;
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
    }
  | {
      type: "updateIntensityTechnique";
      templateExerciseId: string;
      intensityTechnique: IntensityTechnique | null;
    }
  | {
      type: "pairSuperset";
      templateExerciseId: string;
      partnerTemplateExerciseId: string;
    }
  | {
      type: "unpairSuperset";
      templateExerciseId: string;
    };

function getSupersetValidationError(templateExercises: TemplateExercise[]): string {
  const supersetCounts = templateExercises.reduce((counts, exercise) => {
    if (exercise.intensityTechnique === "super-set" && exercise.supersetGroupId) {
      counts.set(exercise.supersetGroupId, (counts.get(exercise.supersetGroupId) ?? 0) + 1);
    }

    return counts;
  }, new Map<string, number>());

  const hasIncompleteSuperset = templateExercises.some((exercise) => {
    if (exercise.intensityTechnique !== "super-set") {
      return false;
    }

    if (!exercise.supersetGroupId) {
      return true;
    }

    return supersetCounts.get(exercise.supersetGroupId) !== 2;
  });

  return hasIncompleteSuperset ? "Please pair every superset exercise before saving" : "";
}

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
      return removeExerciseWithIntensityCleanup(state, action.templateExerciseId);

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

    case "updateIntensityTechnique":
      return setExerciseIntensityTechnique(
        state,
        action.templateExerciseId,
        action.intensityTechnique
      );

    case "pairSuperset": {
      const currentExercise = state.find((exercise) => exercise.id === action.templateExerciseId);
      const partnerExercise = state.find(
        (exercise) => exercise.id === action.partnerTemplateExerciseId
      );

      if (!currentExercise || !partnerExercise) {
        return state;
      }

      const supersetGroupId =
        currentExercise.supersetGroupId ?? partnerExercise.supersetGroupId ?? generateId();

      return pairExercisesAsSuperset(
        state,
        action.templateExerciseId,
        action.partnerTemplateExerciseId,
        supersetGroupId
      );
    }

    case "unpairSuperset":
      return unpairSupersetExercise(state, action.templateExerciseId);

    default:
      return state;
  }
}

export function TemplateEditorPage(): React.ReactElement {
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

  const availableExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
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

    const editorLocationState = location.state as TemplateEditorLocationState;

    const selectionKey = editorLocationState.selectedExerciseId
      ? `${location.key}:${editorLocationState.selectedExerciseId}:${editorLocationState.templateSelectionTarget?.templateExerciseId ?? "append"}`
      : null;

    if (!selectionKey || handledSelectionRef.current === selectionKey) {
      return;
    }

    handledSelectionRef.current = selectionKey;
    navigate(location.pathname, { replace: true, state: {} });

    if (editorLocationState.selectedExerciseId && editorLocationState.templateSelectionTarget) {
      dispatchTemplateExercises({
        type: "replaceExercise",
        templateExerciseId: editorLocationState.templateSelectionTarget.templateExerciseId,
        exerciseId: editorLocationState.selectedExerciseId,
      });
      return;
    }

    if (editorLocationState.selectedExerciseId && editorLocationState.appendTemplateExercise) {
      dispatchTemplateExercises({
        type: "appendExercise",
        templateExercise: {
          id: generateId(),
          exerciseId: editorLocationState.selectedExerciseId,
          setCount: 3,
        },
      });
      return;
    }
  }, [location.key, location.pathname, location.state, navigate]);

  /** Preserves current in-progress changes while navigating to exercise selection. */
  const createDraftSnapshot = (): WorkoutTemplateDraft => ({
    name,
    exercises: templateExercises.map((exercise) => ({ ...exercise })),
  });

  const getExerciseSelectionPath = (): string => {
    return isEditMode ? `/templates/edit/${id}/select-exercise` : "/templates/new/select-exercise";
  };

  /** Navigates to the exercise picker while keeping the current editor draft in route state. */
  const openExerciseSelection = (selectionState: TemplateEditorLocationState): void => {
    const templateDraft = createDraftSnapshot();

    navigate(location.pathname, {
      replace: true,
      state: { templateDraft },
      flushSync: true,
    });

    queueMicrotask(() => {
      navigate(getExerciseSelectionPath(), {
        state: {
          exercises: availableExercises,
          templateDraft,
          ...selectionState,
        },
      });
    });
  };

  const saveTemplate = (): void => {
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
    const supersetValidationError = getSupersetValidationError(cleanedExercises);

    if (supersetValidationError) {
      setError(supersetValidationError);
      return;
    }

    const savedTemplate: WorkoutTemplate = {
      id: isEditMode ? id! : generateId(),
      name: trimmedName,
      muscleGroups: buildTemplateMuscleGroups(cleanedExercises, availableExercises),
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

  const handleAddExercise = (): void => {
    setError("");

    openExerciseSelection({ appendTemplateExercise: true });
  };

  const removeExercise = (templateExerciseId: string): void => {
    dispatchTemplateExercises({ type: "removeExercise", templateExerciseId });
  };

  const moveExercise = (templateExerciseId: string, direction: "up" | "down"): void => {
    dispatchTemplateExercises({ type: "moveExercise", templateExerciseId, direction });
  };

  const handleSelectExercise = (templateExerciseId: string): void => {
    setError("");
    const templateExercise = templateExercises.find(
      (exercise) => exercise.id === templateExerciseId
    );
    const currentExercise = getExerciseById(templateExercise?.exerciseId ?? null);

    openExerciseSelection({
      initialMuscleGroup: currentExercise?.muscleGroup,
      templateSelectionTarget: {
        templateExerciseId,
      },
      templateUpdateChecked: true,
    });
  };

  const getExerciseById = (exerciseId: string | null): Exercise | null => {
    if (!exerciseId) return null;
    return availableExercises.find((exercise) => exercise.id === exerciseId) ?? null;
  };

  const supersetDisplayLabels = getSupersetDisplayLabels(templateExercises);

  const getSupersetPartnerOptions = (templateExerciseId: string): TemplateExercise[] => {
    return templateExercises.filter(
      (exercise) => exercise.id !== templateExerciseId && exercise.exerciseId !== null
    );
  };

  const updateIntensityTechnique = (
    templateExerciseId: string,
    intensityTechnique: IntensityTechnique | null
  ) => {
    setError("");
    dispatchTemplateExercises({
      type: "updateIntensityTechnique",
      templateExerciseId,
      intensityTechnique,
    });
  };

  const updateSupersetPair = (templateExerciseId: string, partnerTemplateExerciseId: string): void => {
    setError("");

    if (!partnerTemplateExerciseId) {
      dispatchTemplateExercises({
        type: "unpairSuperset",
        templateExerciseId,
      });
      return;
    }

    dispatchTemplateExercises({
      type: "pairSuperset",
      templateExerciseId,
      partnerTemplateExerciseId,
    });
  };

  const updateSetCount = (templateExerciseId: string, delta: number): void => {
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
              const supersetPartnerId = getSupersetPartnerId(
                templateExercises,
                templateExercise.id
              );
              const supersetPartnerExercise = templateExercises.find(
                (item) => item.id === supersetPartnerId
              );
              const supersetLabel = templateExercise.supersetGroupId
                ? supersetDisplayLabels[templateExercise.supersetGroupId]
                : null;

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
                        {templateExercise.intensityTechnique && (
                          <span className="templates-exercise-intensity-chip">
                            {templateExercise.intensityTechnique === "super-set" && supersetLabel
                              ? supersetLabel
                              : intensityTechniqueLabels[templateExercise.intensityTechnique]}
                          </span>
                        )}
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

                    {exercise && (
                      <div className="templates-intensity-controls">
                        <label className="templates-intensity-field">
                          <span className="templates-intensity-label">Technique</span>
                          <select
                            aria-label={`Intensity technique for ${exercise.name}`}
                            value={templateExercise.intensityTechnique ?? ""}
                            onChange={(event) =>
                              updateIntensityTechnique(
                                templateExercise.id,
                                (event.target.value || null) as IntensityTechnique | null
                              )
                            }
                          >
                            <option value="">Standard</option>
                            {INTENSITY_TECHNIQUES.map((technique) => (
                              <option key={technique} value={technique}>
                                {intensityTechniqueLabels[technique]}
                              </option>
                            ))}
                          </select>
                        </label>

                        {templateExercise.intensityTechnique === "super-set" && (
                          <label className="templates-intensity-field">
                            <span className="templates-intensity-label">Paired with</span>
                            <select
                              aria-label={`Superset pair for ${exercise.name}`}
                              value={supersetPartnerId ?? ""}
                              onChange={(event) =>
                                updateSupersetPair(templateExercise.id, event.target.value)
                              }
                            >
                              <option value="">Select exercise</option>
                              {getSupersetPartnerOptions(templateExercise.id).map((partner) => {
                                const partnerExercise = getExerciseById(partner.exerciseId);

                                if (!partnerExercise) {
                                  return null;
                                }

                                return (
                                  <option key={partner.id} value={partner.id}>
                                    {partnerExercise.name}
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                        )}

                        {templateExercise.intensityTechnique === "super-set" &&
                          supersetPartnerExercise && (
                            <p className="templates-intensity-hint">
                              Paired with{" "}
                              {getExerciseById(supersetPartnerExercise.exerciseId)?.name}
                            </p>
                          )}
                      </div>
                    )}
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
