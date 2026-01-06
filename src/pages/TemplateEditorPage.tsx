import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, ChevronLeft, Minus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

import type {
  Exercise,
  WorkoutTemplate,
  TemplateDay,
  TemplateMuscleGroup,
  MuscleGroup,
} from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS, generateId, DEFAULT_EXERCISES } from "../utils/storage";

import { MuscleGroupSelector } from "../components/MuscleGroupSelector";
import { ExerciseSelector } from "../components/ExerciseSelector";

import "./TemplateEditorPage.css";

interface DraftTemplate {
  name: string;
  days: TemplateDay[];
  activeDayIndex: number;
}

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;

  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(STORAGE_KEYS.TEMPLATES, []);

  const [name, setName] = useState("");
  const [days, setDays] = useState<TemplateDay[]>([
    {
      id: generateId(),
      name: "Day 1",
      muscleGroups: [],
    },
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const [showMuscleGroupSelector, setShowMuscleGroupSelector] = useState(false);

  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exerciseSelectorTarget, setExerciseSelectorTarget] = useState<{
    muscleGroupId: string;
    exerciseId: string;
    muscleGroup: MuscleGroup;
  } | null>(null);

  // Merge default exercises with user exercises
  const allExercises = DEFAULT_EXERCISES.map((defaultEx) => {
    const userOverride = exercises.find((e) => e.id === defaultEx.id);
    return userOverride || defaultEx;
  }).concat(exercises.filter((e) => !e.id.startsWith("default-")));

  const activeDay = days[activeDayIndex];

  // Load template data if editing, or draft if creating new (runs once on mount)
  useEffect(() => {
    if (isEditMode) {
      const template = templates.find((t) => t.id === id);
      if (template) {
        setName(template.name);
        setDays(template.days);
        setActiveDayIndex(0);
      } else {
        // Template not found, redirect to templates page
        navigate("/templates", { replace: true });
      }
    } else {
      // Load draft for new template
      try {
        const draftData = localStorage.getItem(STORAGE_KEYS.DRAFT_TEMPLATE);
        if (draftData) {
          const draft: DraftTemplate = JSON.parse(draftData);
          setName(draft.name);
          setDays(draft.days);
          setActiveDayIndex(draft.activeDayIndex);
        }
      } catch (error) {
        console.error("Error loading draft template:", error);
      }
    }
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Save draft when creating new template (not when editing), but only after initialization
  useEffect(() => {
    if (!isEditMode && isInitialized) {
      const draft: DraftTemplate = {
        name,
        days,
        activeDayIndex,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.DRAFT_TEMPLATE, JSON.stringify(draft));
      } catch (error) {
        console.error("Error saving draft template:", error);
      }
    }
  }, [name, days, activeDayIndex, isEditMode, isInitialized]);

  const handleBack = () => {
    navigate("/templates");
  };

  const saveTemplate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a template name");
      return;
    }

    const hasExercises = days.some((day) =>
      day.muscleGroups.some((mg) => mg.exercises.some((ex) => ex.exerciseId !== null))
    );

    if (!hasExercises) {
      setError("Please add at least one exercise to the template");
      return;
    }

    // Filter out muscle groups without any selected exercises
    const cleanedDays = days.map((day) => ({
      ...day,
      muscleGroups: day.muscleGroups
        .map((mg) => ({
          ...mg,
          exercises: mg.exercises.filter((ex) => ex.exerciseId !== null),
        }))
        .filter((mg) => mg.exercises.length > 0),
    }));

    const savedTemplate: WorkoutTemplate = {
      id: isEditMode ? id! : generateId(),
      name: trimmedName,
      days: cleanedDays,
    };

    const existingIndex = templates.findIndex((t) => t.id === savedTemplate.id);
    if (existingIndex >= 0) {
      // Update existing template
      const updated = [...templates];
      updated[existingIndex] = savedTemplate;
      setTemplates(updated);
    } else {
      // Add new template at the beginning (newest first)
      setTemplates([savedTemplate, ...templates]);
    }

    // Clear draft if we were creating a new template
    if (!isEditMode) {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_TEMPLATE);
    }

    navigate("/templates");
  };

  // ========== Day Management ==========

  const addDay = () => {
    const newDay: TemplateDay = {
      id: generateId(),
      name: `Day ${days.length + 1}`,
      muscleGroups: [],
    };
    setDays([...days, newDay]);
    setActiveDayIndex(days.length); // Switch to new day
  };

  const removeDay = (dayIndex: number) => {
    if (days.length <= 1) return;
    const newDays = days.filter((_, i) => i !== dayIndex);
    setDays(newDays);
    // Adjust active index if needed
    if (activeDayIndex >= newDays.length) {
      setActiveDayIndex(newDays.length - 1);
    } else if (activeDayIndex > dayIndex) {
      setActiveDayIndex(activeDayIndex - 1);
    }
  };

  // ========== Muscle Group Management ==========

  const addMuscleGroupToActiveDay = (muscleGroup: MuscleGroup) => {
    const newMuscleGroup: TemplateMuscleGroup = {
      id: generateId(),
      muscleGroup,
      exercises: [
        {
          id: generateId(),
          exerciseId: null,
          setCount: 3,
        },
      ],
    };

    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;
        return {
          ...day,
          muscleGroups: [...day.muscleGroups, newMuscleGroup],
        };
      })
    );

    setShowMuscleGroupSelector(false);
  };

  const removeMuscleGroup = (muscleGroupId: string) => {
    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;
        return {
          ...day,
          muscleGroups: day.muscleGroups.filter((mg) => mg.id !== muscleGroupId),
        };
      })
    );
  };

  const moveMuscleGroup = (muscleGroupId: string, direction: "up" | "down") => {
    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;

        const currentIndex = day.muscleGroups.findIndex((mg) => mg.id === muscleGroupId);
        if (currentIndex === -1) return day;

        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        // Can't move beyond bounds
        if (newIndex < 0 || newIndex >= day.muscleGroups.length) return day;

        // Swap the muscle groups
        const newMuscleGroups = [...day.muscleGroups];
        [newMuscleGroups[currentIndex], newMuscleGroups[newIndex]] = [
          newMuscleGroups[newIndex],
          newMuscleGroups[currentIndex],
        ];

        return {
          ...day,
          muscleGroups: newMuscleGroups,
        };
      })
    );
  };

  // ========== Exercise Management ==========

  const openExerciseSelector = (
    muscleGroupId: string,
    exerciseId: string,
    muscleGroup: MuscleGroup
  ) => {
    setExerciseSelectorTarget({ muscleGroupId, exerciseId, muscleGroup });
    setShowExerciseSelector(true);
  };

  const selectExercise = (selectedExerciseId: string) => {
    if (!exerciseSelectorTarget) return;

    const { muscleGroupId, exerciseId } = exerciseSelectorTarget;

    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;
        return {
          ...day,
          muscleGroups: day.muscleGroups.map((mg) => {
            if (mg.id !== muscleGroupId) return mg;
            return {
              ...mg,
              exercises: mg.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                return { ...ex, exerciseId: selectedExerciseId };
              }),
            };
          }),
        };
      })
    );

    setShowExerciseSelector(false);
    setExerciseSelectorTarget(null);
    setError("");
  };

  const handleCreateExercise = (exerciseData: Omit<Exercise, "id">): string => {
    const newExercise: Exercise = {
      ...exerciseData,
      id: generateId(),
    };

    // Persist via localStorage
    setExercises([...exercises, newExercise]);

    selectExercise(newExercise.id);

    return newExercise.id;
  };

  const getExerciseById = (id: string | null) => {
    if (!id) return null;
    return allExercises.find((e) => e.id === id) ?? null;
  };

  const updateSetCount = (muscleGroupId: string, exerciseId: string, delta: number) => {
    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;
        return {
          ...day,
          muscleGroups: day.muscleGroups.map((mg) => {
            if (mg.id !== muscleGroupId) return mg;
            return {
              ...mg,
              exercises: mg.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                const newCount = Math.max(1, Math.min(20, ex.setCount + delta));
                return { ...ex, setCount: newCount };
              }),
            };
          }),
        };
      })
    );
  };

  const getFilteredExercises = () => {
    if (!exerciseSelectorTarget) return allExercises;
    return allExercises.filter((e) => e.muscleGroup === exerciseSelectorTarget.muscleGroup);
  };

  return (
    <>
      <div className="page templates-page-editor">
        {/* Header */}
        <div className="templates-editor-header">
          <button className="btn btn-icon btn-ghost" onClick={handleBack} aria-label="Go back">
            <ChevronLeft size={24} />
            Back
          </button>
        </div>

        {/* Title */}
        <div className="templates-title-section">
          <input
            type="text"
            className="templates-name-input"
            placeholder="New template plan"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
        </div>

        {/* Day Tabs */}
        <div className="templates-day-tabs">
          <div className="templates-day-tabs-inner">
            {days.map((day, index) => (
              <button
                key={day.id}
                className={`templates-day-tab ${index === activeDayIndex ? "active" : ""}`}
                onClick={() => setActiveDayIndex(index)}
              >
                {day.name}
                {days.length > 1 && index === activeDayIndex && (
                  <span
                    className="templates-day-tab-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDay(index);
                    }}
                  >
                    <Trash2 size={14} />
                  </span>
                )}
              </button>
            ))}
            <button className="templates-day-tab templates-add-day-tab" onClick={addDay}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Day Content */}
        <div className="templates-day-content">
          {activeDay.muscleGroups.length === 0 ? (
            <div className="templates-empty-day">
              <p>No muscle groups added yet.</p>
              <p className="hint">Tap the + button to add a muscle group.</p>
            </div>
          ) : (
            <div className="templates-muscle-groups-list">
              {activeDay.muscleGroups.map((muscleGroup, mgIndex) => (
                <div key={muscleGroup.id} className="templates-muscle-group-row">
                  <div className="templates-muscle-group-reorder">
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => moveMuscleGroup(muscleGroup.id, "up")}
                      disabled={mgIndex === 0}
                      aria-label="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => moveMuscleGroup(muscleGroup.id, "down")}
                      disabled={mgIndex === activeDay.muscleGroups.length - 1}
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
                              openExerciseSelector(
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
                                onClick={() =>
                                  updateSetCount(muscleGroup.id, templateExercise.id, 1)
                                }
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

        {/* Error */}
        {error && <p className="templates-error">{error}</p>}

        {/* Footer */}
        <div className="templates-editor-footer">
          <button
            type="button"
            className="btn btn-icon templates-fab"
            onClick={() => setShowMuscleGroupSelector(true)}
            aria-label="Add muscle group"
          >
            <Plus size={24} />
          </button>

          <button className="btn btn-accent templates-save-btn" onClick={saveTemplate}>
            {isEditMode ? "SAVE CHANGES" : "CREATE TEMPLATE"}
          </button>
        </div>
      </div>

      {showMuscleGroupSelector && (
        <MuscleGroupSelector
          onSelect={addMuscleGroupToActiveDay}
          onClose={() => setShowMuscleGroupSelector(false)}
        />
      )}

      {showExerciseSelector && exerciseSelectorTarget && (
        <ExerciseSelector
          exercises={getFilteredExercises()}
          onSelect={selectExercise}
          onClose={() => {
            setShowExerciseSelector(false);
            setExerciseSelectorTarget(null);
          }}
          hideFilter
          onCreateExercise={handleCreateExercise}
          initialMuscleGroup={exerciseSelectorTarget.muscleGroup}
        />
      )}
    </>
  );
}
