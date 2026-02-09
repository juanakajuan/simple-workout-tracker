import { useNavigate, useLocation } from "react-router-dom";

import type { WorkoutTemplate, TemplateDay } from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { PageHeader } from "../components/PageHeader";

import "./DaySelectorPage.css";

export function DaySelectorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template as WorkoutTemplate | undefined;

  if (!template) {
    navigate("..", { relative: "path" });
    return null;
  }

  const handleSelect = (day: TemplateDay) => {
    navigate("..", { state: { selectedDay: day, template }, relative: "path" });
  };

  /**
   * Calculates statistics for a template day including total exercises and total sets.
   *
   * @param day - The template day to calculate statistics for
   * @returns Object containing exerciseCount and setCount
   */
  const getDayStats = (day: TemplateDay) => {
    let exerciseCount = 0;
    let setCount = 0;

    day.muscleGroups.forEach((muscleGroup) => {
      muscleGroup.exercises.forEach((exercise) => {
        if (exercise.exerciseId) {
          exerciseCount++;
          setCount += exercise.setCount;
        }
      });
    });

    return { exerciseCount, setCount };
  };

  /**
   * Gets the unique muscle groups present in a template day.
   *
   * @param day - The template day
   * @returns Array of unique muscle groups
   */
  const getUniqueMuscleGroups = (day: TemplateDay) => {
    const groups = new Set(day.muscleGroups.map((muscleGroup) => muscleGroup.muscleGroup));
    return Array.from(groups);
  };

  return (
    <div className="day-selector-page">
      <PageHeader title={template.name} />
      <div className="day-selector-content">
        <p className="day-selector-subtitle">Select a day to start</p>
        <div className="day-selector-list">
          {template.days.map((day) => {
            const stats = getDayStats(day);
            const muscleGroups = getUniqueMuscleGroups(day);

            return (
              <button key={day.id} className="day-selector-item" onClick={() => handleSelect(day)}>
                <div className="day-selector-item-header">
                  <span className="day-selector-item-name">{day.name}</span>
                  <span className="day-selector-item-stats">
                    {stats.exerciseCount} exercise{stats.exerciseCount !== 1 ? "s" : ""} ·{" "}
                    {stats.setCount} set{stats.setCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="day-selector-muscle-groups">
                  {muscleGroups.map((group) => (
                    <span key={group} className="day-selector-muscle-tag">
                      <span
                        className="day-selector-muscle-indicator"
                        style={{ backgroundColor: muscleGroupColors[group] }}
                      />
                      {muscleGroupLabels[group]}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
