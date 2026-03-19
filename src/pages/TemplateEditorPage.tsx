import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, ChevronLeft, Minus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

import type { Exercise, WorkoutTemplate, TemplateMuscleGroup, MuscleGroup } from "../types";
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
  muscleGroupId: string;
  exerciseId: string;
  muscleGroup: MuscleGroup;
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
  const [muscleGroups, setMuscleGroups] = useState<TemplateMuscleGroup[]>([]);
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
        setMuscleGroups(template.muscleGroups);
      } else {
        navigate("/templates", { replace: true });
      }
    } else {
      const draft = getDraftTemplate();
      if (draft) {
        setName(draft.name);
        setMuscleGroups(draft.muscleGroups);
      }
    }

    setIsInitialized(true);
  }, [id, isEditMode, navigate, templates]);

  useEffect(() => {
    if (!isEditMode && isInitialized) {
      saveDraftTemplate({ name, muscleGroups });
    }
  }, [isEditMode, isInitialized, muscleGroups, name]);

  useEffect(() => {
    if (!location.state) return;

    const state = location.state as {
      selectedMuscleGroup?: MuscleGroup;
      selectedMuscleGroups?: MuscleGroup[];
      selectedExerciseId?: string;
      updateTemplate?: boolean;
      templateSelectionTarget?: TemplateSelectionTarget;
    };

    if (state.selectedMuscleGroups && state.selectedMuscleGroups.length > 0) {
      navigate(location.pathname, { replace: true, state: {} });

      const newMuscleGroups: TemplateMuscleGroup[] = state.selectedMuscleGroups.map(
        (muscleGroup) => ({
          id: generateId(),
          muscleGroup,
          exercises: [
            {
              id: generateId(),
              exerciseId: null,
              setCount: 3,
            },
          ],
        })
      );

      setMuscleGroups((previous) => [...previous, ...newMuscleGroups]);
      return;
    }

    if (state.selectedMuscleGroup) {
      navigate(location.pathname, { replace: true, state: {} });

      const newMuscleGroup: TemplateMuscleGroup = {
        id: generateId(),
        muscleGroup: state.selectedMuscleGroup,
        exercises: [
          {
            id: generateId(),
            exerciseId: null,
            setCount: 3,
          },
        ],
      };

      setMuscleGroups((previous) => [...previous, newMuscleGroup]);
      return;
    }

    if (state.selectedExerciseId && state.templateSelectionTarget) {
      navigate(location.pathname, { replace: true, state: {} });

      const { muscleGroupId, exerciseId } = state.templateSelectionTarget;

      setMuscleGroups((previous) =>
        previous.map((muscleGroup) => {
          if (muscleGroup.id !== muscleGroupId) return muscleGroup;
          return {
            ...muscleGroup,
            exercises: muscleGroup.exercises.map((exercise) => {
              if (exercise.id !== exerciseId) return exercise;
              return { ...exercise, exerciseId: state.selectedExerciseId! };
            }),
          };
        })
      );

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

    const hasExercises = muscleGroups.some((muscleGroup) =>
      muscleGroup.exercises.some((exercise) => exercise.exerciseId !== null)
    );

    if (!hasExercises) {
      setError("Please add at least one exercise to the template");
      return;
    }

    const cleanedMuscleGroups = muscleGroups
      .map((muscleGroup) => ({
        ...muscleGroup,
        exercises: muscleGroup.exercises.filter((exercise) => exercise.exerciseId !== null),
      }))
      .filter((muscleGroup) => muscleGroup.exercises.length > 0);

    const savedTemplate: WorkoutTemplate = {
      id: isEditMode ? id! : generateId(),
      name: trimmedName,
      muscleGroups: cleanedMuscleGroups,
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

  const handleAddMuscleGroup = () => {
    const path = isEditMode
      ? `/templates/edit/${id}/select-muscle-group`
      : "/templates/new/select-muscle-group";
    const existingMuscleGroups = muscleGroups.map((group) => group.muscleGroup);
    navigate(path, { state: { existingMuscleGroups } });
  };

  const removeMuscleGroup = (muscleGroupId: string) => {
    setMuscleGroups((previous) =>
      previous.filter((muscleGroup) => muscleGroup.id !== muscleGroupId)
    );
  };

  const moveMuscleGroup = (muscleGroupId: string, direction: "up" | "down") => {
    setMuscleGroups((previous) => {
      const currentIndex = previous.findIndex((muscleGroup) => muscleGroup.id === muscleGroupId);
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

  const handleSelectExercise = (
    muscleGroupId: string,
    exerciseId: string,
    muscleGroup: MuscleGroup
  ) => {
    const path = isEditMode
      ? `/templates/edit/${id}/select-exercise`
      : "/templates/new/select-exercise";
    navigate(path, {
      state: {
        exercises: allExercises,
        hideFilter: true,
        initialMuscleGroup: muscleGroup,
        templateUpdateChecked: true,
        templateSelectionTarget: {
          muscleGroupId,
          exerciseId,
          muscleGroup,
        },
      },
    });
  };

  const getExerciseById = (exerciseId: string | null) => {
    if (!exerciseId) return null;
    return allExercises.find((exercise) => exercise.id === exerciseId) ?? null;
  };

  const updateSetCount = (muscleGroupId: string, exerciseId: string, delta: number) => {
    setMuscleGroups((previous) =>
      previous.map((muscleGroup) => {
        if (muscleGroup.id !== muscleGroupId) return muscleGroup;
        return {
          ...muscleGroup,
          exercises: muscleGroup.exercises.map((exercise) => {
            if (exercise.id !== exerciseId) return exercise;
            const newCount = Math.max(1, Math.min(20, exercise.setCount + delta));
            return { ...exercise, setCount: newCount };
          }),
        };
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
        {muscleGroups.length === 0 ? (
          <div className="templates-empty-day">
            <p>No muscle groups added yet.</p>
            <p className="hint">Tap the + button to build this workout template.</p>
          </div>
        ) : (
          <div className="templates-muscle-groups-list">
            {muscleGroups.map((muscleGroup, muscleGroupIndex) => (
              <div key={muscleGroup.id} className="templates-muscle-group-row">
                <div className="templates-muscle-group-reorder">
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => moveMuscleGroup(muscleGroup.id, "up")}
                    disabled={muscleGroupIndex === 0}
                    aria-label="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => moveMuscleGroup(muscleGroup.id, "down")}
                    disabled={muscleGroupIndex === muscleGroups.length - 1}
                    aria-label="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div className="templates-muscle-group-content">
                  <div className="templates-muscle-group-header">
                    <span
                      className="muscle-group-indicator-bar"
                      style={{ backgroundColor: muscleGroupColors[muscleGroup.muscleGroup] }}
                    />
                    <span className="templates-muscle-group-name">
                      {muscleGroupLabels[muscleGroup.muscleGroup]}
                    </span>
                  </div>

                  {muscleGroup.exercises.map((templateExercise) => {
                    const exercise = getExerciseById(templateExercise.exerciseId);

                    return (
                      <div
                        key={templateExercise.id}
                        className={`templates-exercise-row ${exercise ? "has-selected-exercise" : ""}`}
                      >
                        <button
                          className={`templates-exercise-btn ${exercise ? "has-exercise" : ""}`}
                          onClick={() =>
                            handleSelectExercise(
                              muscleGroup.id,
                              templateExercise.id,
                              muscleGroup.muscleGroup
                            )
                          }
                        >
                          {exercise ? exercise.name : "Choose an exercise"}
                        </button>
                        {exercise && (
                          <div className="templates-set-count-control">
                            <button
                              type="button"
                              className="btn btn-icon btn-ghost btn-sm"
                              onClick={() =>
                                updateSetCount(muscleGroup.id, templateExercise.id, -1)
                              }
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
                              onClick={() => updateSetCount(muscleGroup.id, templateExercise.id, 1)}
                              disabled={templateExercise.setCount >= 20}
                              aria-label="Increase sets"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  className="btn btn-icon btn-ghost templates-muscle-group-delete"
                  onClick={() => removeMuscleGroup(muscleGroup.id)}
                  aria-label="Remove muscle group"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="templates-error">{error}</p>}

      <div className="templates-editor-footer">
        <button
          type="button"
          className="btn btn-icon templates-fab"
          onClick={handleAddMuscleGroup}
          aria-label="Add muscle group"
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
