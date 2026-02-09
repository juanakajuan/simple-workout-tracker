import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Plus,
  ChevronLeft,
  Minus,
  ChevronUp,
  ChevronDown,
  Trash2,
  MoreVertical,
} from "lucide-react";

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

import "./TemplateEditorPage.css";

interface DraftTemplate {
  name: string;
  days: TemplateDay[];
  activeDayIndex: number;
}

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const [exerciseSelectorTarget, setExerciseSelectorTarget] = useState<{
    muscleGroupId: string;
    exerciseId: string;
    muscleGroup: MuscleGroup;
  } | null>(null);

  const [showDayMenu, setShowDayMenu] = useState(false);

  // Merge default exercises with user exercises
  const allExercises = DEFAULT_EXERCISES.map((defaultExercise) => {
    const userOverride = exercises.find((exercise) => exercise.id === defaultExercise.id);
    return userOverride || defaultExercise;
  }).concat(exercises.filter((exercise) => !exercise.id.startsWith("default-")));

  const activeDay = days[activeDayIndex];

  // Load template data if editing, or draft if creating new (runs once on mount)
  useEffect(() => {
    if (isEditMode) {
      const template = templates.find((template) => template.id === id);
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

  // Handle navigation state from muscle group selector, exercise selector, and day editor
  useEffect(() => {
    if (!location.state) return;

    const state = location.state as {
      selectedMuscleGroup?: MuscleGroup;
      selectedExerciseId?: string;
      updateTemplate?: boolean;
      updatedDays?: TemplateDay[];
      updatedActiveDayIndex?: number;
      newExercise?: Exercise;
    };

    // Handle muscle group selection
    if (state.selectedMuscleGroup) {
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

      setDays(
        days.map((day, i) => {
          if (i !== activeDayIndex) return day;
          return {
            ...day,
            muscleGroups: [...day.muscleGroups, newMuscleGroup],
          };
        })
      );

      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }

    // Handle new exercise creation
    if (state.newExercise) {
      setExercises([...exercises, state.newExercise]);
    }

    // Handle exercise selection
    if (state.selectedExerciseId && state.updateTemplate && exerciseSelectorTarget) {
      const { muscleGroupId, exerciseId } = exerciseSelectorTarget;
      const selectedExerciseId = state.selectedExerciseId;

      setDays(
        days.map((day, i) => {
          if (i !== activeDayIndex) return day;
          return {
            ...day,
            muscleGroups: day.muscleGroups.map((muscleGroup) => {
              if (muscleGroup.id !== muscleGroupId) return muscleGroup;
              return {
                ...muscleGroup,
                exercises: muscleGroup.exercises.map((exercise) => {
                  if (exercise.id !== exerciseId) return exercise;
                  return { ...exercise, exerciseId: selectedExerciseId };
                }),
              };
            }),
          };
        })
      );

      setExerciseSelectorTarget(null);
      setError("");

      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }

    // Handle day editor updates
    if (state.updatedDays && state.updatedActiveDayIndex !== undefined) {
      setDays(state.updatedDays);
      setActiveDayIndex(state.updatedActiveDayIndex);

      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    location.pathname,
    navigate,
    activeDayIndex,
    days,
    exerciseSelectorTarget,
    exercises,
    setExercises,
  ]);

  /**
   * Navigates back to the templates list page.
   */
  const handleBack = () => {
    navigate("/templates");
  };

  /**
   * Validates and saves the template to localStorage. Performs validation
   * to ensure the template has a name and at least one exercise. Filters out
   * empty muscle groups before saving. Clears any draft if creating a new template.
   */
  const saveTemplate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a template name");
      return;
    }

    const hasExercises = days.some((day) =>
      day.muscleGroups.some((muscleGroup) =>
        muscleGroup.exercises.some((exercise) => exercise.exerciseId !== null)
      )
    );

    if (!hasExercises) {
      setError("Please add at least one exercise to the template");
      return;
    }

    // Filter out muscle groups without any selected exercises
    const cleanedDays = days.map((day) => ({
      ...day,
      muscleGroups: day.muscleGroups
        .map((muscleGroup) => ({
          ...muscleGroup,
          exercises: muscleGroup.exercises.filter((exercise) => exercise.exerciseId !== null),
        }))
        .filter((muscleGroup) => muscleGroup.exercises.length > 0),
    }));

    const savedTemplate: WorkoutTemplate = {
      id: isEditMode ? id! : generateId(),
      name: trimmedName,
      days: cleanedDays,
    };

    const existingIndex = templates.findIndex((template) => template.id === savedTemplate.id);
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

  /**
   * Toggles the day management kebab menu dropdown.
   */
  const toggleDayMenu = () => {
    setShowDayMenu(!showDayMenu);
  };

  /**
   * Opens the day editor via navigation.
   */
  const handleOpenDayEditor = () => {
    const path = isEditMode ? `/templates/${id}/edit-days` : "/templates/new/edit-days";
    navigate(path, { state: { days, activeDayIndex } });
    setShowDayMenu(false);
  };

  /**
   * Closes the day menu when clicking outside of it.
   *
   * @param event - The mouse event
   */
  const handleDayMenuClickOutside = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest(".templates-day-menu")) return;
    setShowDayMenu(false);
  };

  // ========== Muscle Group Management ==========

  /**
   * Navigates to the muscle group selector for adding a new muscle group.
   */
  const handleAddMuscleGroup = () => {
    const path = isEditMode
      ? `/templates/${id}/select-muscle-group`
      : "/templates/new/select-muscle-group";
    navigate(path);
  };

  /**
   * Removes a muscle group from the active day.
   *
   * @param muscleGroupId - The unique identifier of the muscle group to remove
   */
  const removeMuscleGroup = (muscleGroupId: string) => {
    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;
        return {
          ...day,
          muscleGroups: day.muscleGroups.filter((muscleGroup) => muscleGroup.id !== muscleGroupId),
        };
      })
    );
  };

  /**
   * Moves a muscle group up or down in the active day's list.
   *
   * @param muscleGroupId - The unique identifier of the muscle group to move
   * @param direction - The direction to move: "up" or "down"
   */
  const moveMuscleGroup = (muscleGroupId: string, direction: "up" | "down") => {
    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;

        const currentIndex = day.muscleGroups.findIndex(
          (muscleGroup) => muscleGroup.id === muscleGroupId
        );
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

  /**
   * Navigates to the exercise selector for a specific exercise slot in a muscle group.
   *
   * @param muscleGroupId - The unique identifier of the muscle group
   * @param exerciseId - The unique identifier of the template exercise
   * @param muscleGroup - The muscle group type for filtering exercises
   */
  const handleSelectExercise = (
    muscleGroupId: string,
    exerciseId: string,
    muscleGroup: MuscleGroup
  ) => {
    setExerciseSelectorTarget({ muscleGroupId, exerciseId, muscleGroup });
    const path = isEditMode ? `/templates/${id}/select-exercise` : "/templates/new/select-exercise";
    navigate(path, { state: { muscleGroup, updateTemplate: true } });
  };

  /**
   * Retrieves an exercise by its unique identifier from the merged list of
   * default and user exercises.
   *
   * @param id - The unique identifier of the exercise, or null
   * @returns The exercise if found, null otherwise
   */
  const getExerciseById = (id: string | null) => {
    if (!id) return null;
    return allExercises.find((exercise) => exercise.id === id) ?? null;
  };

  /**
   * Updates the set count for a template exercise by adding or subtracting a delta.
   * Constrains the set count between 1 and 20.
   *
   * @param muscleGroupId - The unique identifier of the muscle group
   * @param exerciseId - The unique identifier of the template exercise
   * @param delta - The amount to add to the set count (can be negative)
   */
  const updateSetCount = (muscleGroupId: string, exerciseId: string, delta: number) => {
    setDays(
      days.map((day, i) => {
        if (i !== activeDayIndex) return day;
        return {
          ...day,
          muscleGroups: day.muscleGroups.map((muscleGroup) => {
            if (muscleGroup.id !== muscleGroupId) return muscleGroup;
            return {
              ...muscleGroup,
              exercises: muscleGroup.exercises.map((exercise) => {
                if (exercise.id !== exerciseId) return exercise;
                const newCount = Math.max(1, Math.min(20, exercise.setCount + delta));
                return { ...exercise, setCount: newCount };
              }),
            };
          }),
        };
      })
    );
  };

  return (
    <>
      <div className="page templates-page-editor" onClick={handleDayMenuClickOutside}>
        {/* Header */}
        <div className="templates-editor-header">
          <button className="btn btn-icon btn-ghost" onClick={handleBack} aria-label="Go back">
            <ChevronLeft size={24} />
            Back
          </button>

          {/* Day Management Menu */}
          <div className="templates-day-menu">
            <button
              className="btn btn-ghost btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleDayMenu();
              }}
              aria-label="Day options"
              aria-expanded={showDayMenu}
            >
              <MoreVertical size={20} />
            </button>
            {showDayMenu && (
              <div className="templates-day-menu-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDayEditor();
                  }}
                >
                  Edit Days
                </button>
              </div>
            )}
          </div>
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
              </button>
            ))}
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
            onClick={handleAddMuscleGroup}
            aria-label="Add muscle group"
          >
            <Plus size={24} />
          </button>

          <button
            className="btn btn-accent templates-save-btn text-uppercase"
            onClick={saveTemplate}
          >
            {isEditMode ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>
    </>
  );
}
