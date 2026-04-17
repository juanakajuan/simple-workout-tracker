import { useMemo } from "react";

import type { Exercise, MuscleGroup, Workout } from "../types";
import { muscleGroupLabels, muscleGroupColors } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS, DEFAULT_EXERCISES } from "../utils/storage";

import { PageHeader } from "../components/PageHeader";
import { Tag } from "../components/Tag";

import "./WeeklySetsTrackerPage.css";

const WEEK_WINDOW_SIZE = 8;

interface WeeklyMuscleGroupData {
  muscleGroup: MuscleGroup;
  weekSets: number[];
  currentWeekSets: number;
  previousWeekSets: number;
  weekOverWeekChange: number;
  totalSets: number;
  maxWeekSets: number;
}

/**
 * Returns the Monday start date for the week containing the given date.
 *
 * @param date - Date to normalize to week start
 * @returns New Date at local midnight on Monday of that week
 */
function getStartOfWeekMonday(date: Date): Date {
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = normalizedDate.getDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;
  normalizedDate.setDate(normalizedDate.getDate() - daysFromMonday);
  return normalizedDate;
}

/**
 * Converts a date to a stable local date key in YYYY-MM-DD format.
 *
 * @param date - Date to convert
 * @returns Local date key string
 */
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a week start date into a short month-day label.
 *
 * @param date - Week start date
 * @returns Formatted label (e.g., "Jan 6")
 */
function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Formats week-over-week set changes for tracker display.
 *
 * @param currentWeekSets - Completed sets in current week
 * @param previousWeekSets - Completed sets in previous week
 * @returns Human-readable change label
 */
function formatWeekChange(currentWeekSets: number, previousWeekSets: number): string {
  const change = currentWeekSets - previousWeekSets;
  if (previousWeekSets === 0 && currentWeekSets > 0) {
    return `+${currentWeekSets} new sets`;
  }
  if (change > 0) {
    return `+${change} vs last week`;
  }
  if (change < 0) {
    return `${change} vs last week`;
  }
  return "No change vs last week";
}

export function WeeklySetsTrackerPage(): React.ReactElement {
  const [workouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  const [userExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);

  const allExercises = useMemo(
    () =>
      DEFAULT_EXERCISES.map((defaultExercise) => {
        const userOverride = userExercises.find((exercise) => exercise.id === defaultExercise.id);
        return userOverride || defaultExercise;
      }).concat(userExercises.filter((exercise) => !exercise.id.startsWith("default-"))),
    [userExercises]
  );

  const exerciseById = useMemo(
    () => new Map(allExercises.map((exercise) => [exercise.id, exercise])),
    [allExercises]
  );

  const { weekStarts, weeklyMuscleGroupData } = useMemo(() => {
    const currentWeekStart = getStartOfWeekMonday(new Date());
    const firstWeekStart = new Date(currentWeekStart);
    firstWeekStart.setDate(firstWeekStart.getDate() - (WEEK_WINDOW_SIZE - 1) * 7);

    const weekStartDates = Array.from({ length: WEEK_WINDOW_SIZE }, (_, index) => {
      const weekStartDate = new Date(firstWeekStart);
      weekStartDate.setDate(weekStartDate.getDate() + index * 7);
      return weekStartDate;
    });
    const weekKeys = weekStartDates.map((date) => getDateKey(date));

    const setsByMuscleGroupAndWeek: Partial<Record<MuscleGroup, Record<string, number>>> = {};

    workouts.forEach((workout) => {
      if (!workout.completed) {
        return;
      }

      const workoutDate = new Date(workout.date);
      const workoutWeekStart = getStartOfWeekMonday(workoutDate);

      if (workoutWeekStart < firstWeekStart || workoutWeekStart > currentWeekStart) {
        return;
      }

      const weekKey = getDateKey(workoutWeekStart);

      workout.exercises.forEach((workoutExercise) => {
        const exercise =
          exerciseById.get(workoutExercise.exerciseId) ?? workoutExercise.exerciseSnapshot;
        if (!exercise) {
          return;
        }

        const completedSets = workoutExercise.sets.filter((set) => set.completed).length;
        if (completedSets === 0) {
          return;
        }

        if (!setsByMuscleGroupAndWeek[exercise.muscleGroup]) {
          setsByMuscleGroupAndWeek[exercise.muscleGroup] = {};
        }

        const muscleGroupWeekSets = setsByMuscleGroupAndWeek[exercise.muscleGroup] as Record<
          string,
          number
        >;
        muscleGroupWeekSets[weekKey] = (muscleGroupWeekSets[weekKey] || 0) + completedSets;
      });
    });

    const weeklyData = Object.entries(setsByMuscleGroupAndWeek)
      .map(([muscleGroup, weeklySetMap]) => {
        const weekSets = weekKeys.map((key) => weeklySetMap?.[key] || 0);
        const totalSets = weekSets.reduce(
          (accumulator, weekSetCount) => accumulator + weekSetCount,
          0
        );
        const currentWeekSets = weekSets[weekSets.length - 1] || 0;
        const previousWeekSets = weekSets[weekSets.length - 2] || 0;
        const weekOverWeekChange = currentWeekSets - previousWeekSets;
        const maxWeekSets = weekSets.reduce(
          (accumulator, weekSetCount) => Math.max(accumulator, weekSetCount),
          0
        );

        return {
          muscleGroup: muscleGroup as MuscleGroup,
          weekSets,
          currentWeekSets,
          previousWeekSets,
          weekOverWeekChange,
          totalSets,
          maxWeekSets,
        } satisfies WeeklyMuscleGroupData;
      })
      .filter((muscleGroupData) => muscleGroupData.totalSets > 0)
      .sort((a, b) => {
        if (b.currentWeekSets !== a.currentWeekSets) {
          return b.currentWeekSets - a.currentWeekSets;
        }
        if (b.totalSets !== a.totalSets) {
          return b.totalSets - a.totalSets;
        }
        return muscleGroupLabels[a.muscleGroup].localeCompare(muscleGroupLabels[b.muscleGroup]);
      });

    return {
      weekStarts: weekStartDates,
      weeklyMuscleGroupData: weeklyData,
    };
  }, [workouts, exerciseById]);

  return (
    <div className="weekly-sets-page">
      <PageHeader title="Weekly Sets" />

      <div className="weekly-sets-content">
        <section className="weekly-sets-tracker card" aria-label="Weekly sets per muscle group">
          <div className="weekly-sets-header">
            <h2 className="weekly-sets-title">Weekly Sets Tracker</h2>
            <p className="weekly-sets-subtitle">
              Last {WEEK_WINDOW_SIZE} weeks (Mon-Sun): {formatWeekLabel(weekStarts[0])} -{" "}
              {formatWeekLabel(weekStarts[weekStarts.length - 1])}
            </p>
          </div>

          {weeklyMuscleGroupData.length === 0 ? (
            <div className="weekly-sets-empty">
              <p>No completed sets in the last {WEEK_WINDOW_SIZE} weeks.</p>
              <p className="hint">Finish workouts to unlock weekly muscle-group trends.</p>
            </div>
          ) : (
            <div className="weekly-muscle-groups">
              {weeklyMuscleGroupData.map((muscleGroupData) => (
                <div key={muscleGroupData.muscleGroup} className="weekly-muscle-group-row">
                  <div className="weekly-muscle-group-header">
                    <Tag muscleGroup={muscleGroupData.muscleGroup}>
                      {muscleGroupLabels[muscleGroupData.muscleGroup]}
                    </Tag>
                    <div className="weekly-muscle-group-stats">
                      <span className="weekly-current-sets">
                        {muscleGroupData.currentWeekSets} this week
                      </span>
                      <span
                        className={`weekly-change ${
                          muscleGroupData.weekOverWeekChange > 0
                            ? "positive"
                            : muscleGroupData.weekOverWeekChange < 0
                              ? "negative"
                              : "neutral"
                        }`}
                      >
                        {formatWeekChange(
                          muscleGroupData.currentWeekSets,
                          muscleGroupData.previousWeekSets
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="weekly-bars" aria-hidden="true">
                    {muscleGroupData.weekSets.map((setCount, weekIndex) => {
                      const barHeightPercent =
                        muscleGroupData.maxWeekSets === 0
                          ? 8
                          : Math.max(
                              (setCount / muscleGroupData.maxWeekSets) * 100,
                              setCount > 0 ? 8 : 0
                            );

                      const isCurrentWeek = weekIndex === muscleGroupData.weekSets.length - 1;
                      const shouldShowLabel =
                        weekIndex === 0 ||
                        weekIndex === Math.floor((muscleGroupData.weekSets.length - 1) / 2) ||
                        isCurrentWeek;

                      return (
                        <div
                          key={`${muscleGroupData.muscleGroup}-${weekIndex}`}
                          className="weekly-bar-column"
                        >
                          <div className="weekly-bar-track">
                            <div
                              className={`weekly-bar${isCurrentWeek ? " current" : ""}`}
                              style={{
                                height: `${barHeightPercent}%`,
                                backgroundColor: muscleGroupColors[muscleGroupData.muscleGroup],
                              }}
                            />
                          </div>
                          <span className="weekly-bar-count">{setCount}</span>
                          <span className="weekly-bar-label">
                            {shouldShowLabel ? formatWeekLabel(weekStarts[weekIndex]) : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
