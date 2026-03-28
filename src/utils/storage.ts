import type {
  Exercise,
  TemplateExercise,
  TemplateMuscleGroup,
  Workout,
  WorkoutTemplate,
  WorkoutTemplateDraft,
  Settings,
} from "../types";

/**
 * localStorage keys used throughout the application.
 * All keys are prefixed with "zenith_" to avoid conflicts with other applications.
 */
export const STORAGE_KEYS = {
  EXERCISES: "zenith_exercises",
  WORKOUTS: "zenith_workouts",
  ACTIVE_WORKOUT: "zenith_active_workout",
  TEMPLATES: "zenith_templates",
  DRAFT_TEMPLATE: "zenith_draft_template",
  SETTINGS: "zenith_settings",
} as const;

/**
 * Pre-populated default exercises provided by the application.
 * Re-exported from the defaultExercises module.
 */
export { DEFAULT_EXERCISES } from "../data/defaultExercises";

/**
 * Generates a unique identifier for database entities.
 * Uses a combination of timestamp and random string to ensure uniqueness.
 *
 * @returns A unique ID string in the format "{timestamp}-{randomString}"
 *
 * @example
 * generateId() // Returns "1704067200000-a7b3k9x"
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Checks if an exercise ID belongs to a default exercise.
 * Default exercises have IDs prefixed with "default-" and cannot be deleted.
 *
 * @param exerciseId - The exercise ID to check
 * @returns True if the exercise is a default exercise, false otherwise
 *
 * @example
 * isDefaultExercise("default-bench-press") // Returns true
 * isDefaultExercise("1704067200000-a7b3k9x") // Returns false
 */
export function isDefaultExercise(exerciseId: string): boolean {
  return exerciseId.startsWith("default-");
}

/**
 * Checks whether a value is a non-null object record.
 *
 * @param value - Value to inspect
 * @returns True when the value is an object that can be accessed by keys
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Reads and parses a JSON value from localStorage.
 *
 * @param key - Storage key to read
 * @returns Parsed value, or null when missing or invalid
 */
function parseStoredValue(key: string): unknown {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Parses a JSON string while preserving invalid input as undefined.
 *
 * @param value - Raw JSON string to parse
 * @returns Parsed value, or undefined when parsing fails
 */
function parseJsonString(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Normalizes a potential template exercise into a typed object.
 *
 * @param value - Candidate template exercise
 * @returns Normalized exercise, or null for invalid input
 */
function normalizeTemplateExercise(value: unknown): TemplateExercise | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "string" ? value.id : "";
  if (!id) return null;

  return {
    id,
    exerciseId:
      typeof value.exerciseId === "string" || value.exerciseId === null ? value.exerciseId : null,
    setCount:
      typeof value.setCount === "number" && Number.isFinite(value.setCount) && value.setCount > 0
        ? value.setCount
        : 1,
  };
}

/**
 * Normalizes a potential template exercise list into a typed array.
 *
 * @param value - Candidate template exercise collection
 * @returns Normalized exercises, or an empty array for invalid input
 */
function normalizeTemplateExercises(value: unknown): TemplateExercise[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((exercise) => {
    const normalizedExercise = normalizeTemplateExercise(exercise);
    return normalizedExercise ? [normalizedExercise] : [];
  });
}

/**
 * Normalizes a potential muscle group list into a typed array.
 *
 * @param value - Candidate muscle group collection
 * @returns Normalized muscle groups, or an empty array for invalid input
 */
function normalizeMuscleGroups(value: unknown): TemplateMuscleGroup[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((muscleGroup) => {
    if (!isRecord(muscleGroup)) return [];

    const id = typeof muscleGroup.id === "string" ? muscleGroup.id : "";
    const groupName = typeof muscleGroup.muscleGroup === "string" ? muscleGroup.muscleGroup : "";
    if (!id || !groupName) return [];

    return [
      {
        id,
        muscleGroup: groupName as TemplateMuscleGroup["muscleGroup"],
        exercises: Array.isArray(muscleGroup.exercises)
          ? muscleGroup.exercises.flatMap((exercise) => {
              const normalizedExercise = normalizeTemplateExercise(exercise);
              return normalizedExercise ? [normalizedExercise] : [];
            })
          : [],
      },
    ];
  });
}

/**
 * Normalizes a single stored template value into the current standalone template shape.
 *
 * @param template - Raw stored template value
 * @returns Normalized template, or null for invalid input
 */
function normalizeTemplate(template: unknown): WorkoutTemplate | null {
  if (!isRecord(template)) return null;

  const id = typeof template.id === "string" ? template.id : null;
  const name = typeof template.name === "string" ? template.name : "";
  if (!id || !name.trim()) return null;

  return {
    id,
    name: name.trim(),
    muscleGroups: normalizeMuscleGroups(template.muscleGroups),
  };
}

/**
 * Normalizes stored template data into the current standalone template format.
 *
 * @param value - Raw stored template collection
 * @returns Normalized templates, or an empty array for invalid input
 */
export function normalizeTemplates(value: unknown): WorkoutTemplate[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((template) => {
    const normalizedTemplate = normalizeTemplate(template);
    return normalizedTemplate ? [normalizedTemplate] : [];
  });
}

/**
 * Normalizes stored draft template data.
 *
 * @param value - Raw stored draft value
 * @returns Normalized draft template, or null when the input is unusable
 */
export function normalizeTemplateDraft(value: unknown): WorkoutTemplateDraft | null {
  if (!isRecord(value)) return null;

  const name = typeof value.name === "string" ? value.name : "";

  if (Array.isArray(value.exercises)) {
    return {
      name,
      exercises: normalizeTemplateExercises(value.exercises),
    };
  }

  if (!Array.isArray(value.muscleGroups)) return null;

  return {
    name,
    exercises: normalizeMuscleGroups(value.muscleGroups).flatMap((muscleGroup) =>
      muscleGroup.exercises.map((exercise) => ({ ...exercise }))
    ),
  };
}

/**
 * Normalizes stored active workout data.
 *
 * @param value - Raw stored active workout value
 * @returns Normalized active workout, or null when the input is unusable
 */
export function normalizeActiveWorkout(value: unknown): Workout | null {
  if (!isRecord(value)) return null;

  return value as unknown as Workout;
}

/**
 * Retrieves all user-created exercises from localStorage.
 * Does not include default exercises.
 *
 * @returns Array of user exercises, or empty array if none exist or on error
 *
 * @example
 * const exercises = getExercises();
 * console.log(`Found ${exercises.length} user exercises`);
 */
export function getExercises(): Exercise[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXERCISES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Saves user-created exercises to localStorage.
 * Overwrites any existing exercises.
 *
 * @param exercises - Array of exercises to save
 *
 * @example
 * const exercises = [...getExercises(), newExercise];
 * saveExercises(exercises);
 */
export function saveExercises(exercises: Exercise[]): void {
  localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
}

/**
 * Retrieves all completed workouts from localStorage.
 * Workouts are returned in the order they were saved.
 *
 * @returns Array of completed workouts, or empty array if none exist or on error
 *
 * @example
 * const workouts = getWorkouts();
 * const recentWorkouts = workouts.slice(-5); // Get last 5 workouts
 */
export function getWorkouts(): Workout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Saves completed workouts to localStorage.
 * Overwrites the entire workout history.
 *
 * @param workouts - Array of workouts to save
 *
 * @example
 * const workouts = [...getWorkouts(), completedWorkout];
 * saveWorkouts(workouts);
 */
export function saveWorkouts(workouts: Workout[]): void {
  localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
}

/**
 * Retrieves the currently active (in-progress) workout from localStorage.
 * There can only be one active workout at a time.
 *
 * @returns The active workout object, or null if no workout is in progress or on error
 *
 * @example
 * const activeWorkout = getActiveWorkout();
 * if (activeWorkout) {
 *   console.log(`Resuming workout: ${activeWorkout.name}`);
 * }
 */
export function getActiveWorkout(): Workout | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    return data ? normalizeActiveWorkout(JSON.parse(data)) : null;
  } catch {
    return null;
  }
}

/**
 * Saves or clears the active workout in localStorage.
 * Pass null to clear the active workout (e.g., after completing or canceling).
 *
 * @param workout - The workout to save as active, or null to clear
 *
 * @example
 * // Start a new workout
 * saveActiveWorkout(newWorkout);
 *
 * // Complete the workout (clear active state)
 * saveActiveWorkout(null);
 */
export function saveActiveWorkout(workout: Workout | null): void {
  if (workout) {
    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_WORKOUT,
      JSON.stringify(normalizeActiveWorkout(workout))
    );
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
  }
}

/**
 * Retrieves all workout templates from localStorage.
 * Templates allow users to quickly start predefined workout routines.
 *
 * @returns Array of workout templates, or empty array if none exist or on error
 *
 * @example
 * const templates = getTemplates();
 * const pplTemplate = templates.find(t => t.name === "PPL Split");
 */
export function getTemplates(): WorkoutTemplate[] {
  try {
    return normalizeTemplates(parseStoredValue(STORAGE_KEYS.TEMPLATES));
  } catch {
    return [];
  }
}

/**
 * Saves workout templates to localStorage.
 * Overwrites any existing templates.
 *
 * @param templates - Array of templates to save
 *
 * @example
 * const templates = [...getTemplates(), newTemplate];
 * saveTemplates(templates);
 */
export function saveTemplates(templates: WorkoutTemplate[]): void {
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(normalizeTemplates(templates)));
}

/**
 * Retrieves the in-progress template draft from localStorage.
 *
 * @returns Normalized draft template, or null when no draft exists
 */
export function getDraftTemplate(): WorkoutTemplateDraft | null {
  return normalizeTemplateDraft(parseStoredValue(STORAGE_KEYS.DRAFT_TEMPLATE));
}

/**
 * Saves or clears the current template draft in localStorage.
 *
 * @param draft - Draft template to persist, or null to remove it
 */
export function saveDraftTemplate(draft: WorkoutTemplateDraft | null): void {
  if (draft) {
    localStorage.setItem(
      STORAGE_KEYS.DRAFT_TEMPLATE,
      JSON.stringify(normalizeTemplateDraft(draft))
    );
  } else {
    localStorage.removeItem(STORAGE_KEYS.DRAFT_TEMPLATE);
  }
}

/**
 * Gets the last performed date for a specific exercise.
 * Searches through completed workouts to find the most recent workout containing the exercise.
 *
 * @param exerciseId - The ID of the exercise to find
 * @returns ISO date string of the last workout containing this exercise, or null if never performed
 *
 * @example
 * const lastDate = getLastPerformedDate("exercise-123");
 * if (lastDate) {
 *   console.log(`Last performed: ${formatRelativeDate(lastDate)}`);
 * }
 */
export function getLastPerformedDate(exerciseId: string): string | null {
  const workouts = getWorkouts();

  // Filter to completed workouts that contain this exercise
  const workoutsWithExercise = workouts.filter(
    (workout) => workout.completed && workout.exercises.some((ex) => ex.exerciseId === exerciseId)
  );

  if (workoutsWithExercise.length === 0) {
    return null;
  }

  // Sort by date descending and get the most recent
  const sortedWorkouts = workoutsWithExercise.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sortedWorkouts[0].date;
}

/**
 * Formats an ISO date string as a relative time string.
 * Returns human-readable strings like "Today", "Yesterday", "2 days ago", etc.
 *
 * @param dateString - ISO date string to format
 * @returns Formatted relative date string
 *
 * @example
 * formatRelativeDate("2024-12-29") // Returns "2 days ago" (if today is 2024-12-31)
 * formatRelativeDate("2024-12-31") // Returns "Today"
 * formatRelativeDate("2024-12-30") // Returns "Yesterday"
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  // Reset time components for accurate day comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = nowOnly.getTime() - dateOnly.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
}

/**
 * Retrieves the set data from the last time an exercise was performed.
 * Searches through completed workouts to find the most recent workout containing
 * the exercise and returns the sets from that workout.
 *
 * @param exerciseId - The ID of the exercise to find
 * @returns Array of sets from the last workout, or null if exercise was never performed
 *
 * @example
 * const lastSets = getLastPerformedSets("exercise-123");
 * if (lastSets && lastSets.length > 0) {
 *   console.log(`Last time: ${lastSets[0].weight} lbs x ${lastSets[0].reps} reps`);
 * }
 */
export function getLastPerformedSets(
  exerciseId: string
): { weight: number; reps: number }[] | null {
  const workouts = getWorkouts();

  // Filter to completed workouts that contain this exercise
  const workoutsWithExercise = workouts.filter(
    (workout) =>
      workout.completed && workout.exercises.some((exercise) => exercise.exerciseId === exerciseId)
  );

  if (workoutsWithExercise.length === 0) {
    return null;
  }

  // Sort by date descending and get the most recent
  const sortedWorkouts = workoutsWithExercise.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Find the exercise in the most recent workout
  const mostRecentWorkout = sortedWorkouts[0];
  const workoutExercise = mostRecentWorkout.exercises.find(
    (exercise) => exercise.exerciseId === exerciseId
  );

  if (!workoutExercise || workoutExercise.sets.length === 0) {
    return null;
  }

  return workoutExercise.sets.map((set) => ({
    weight: set.weight,
    reps: set.reps,
  }));
}

/**
 * Retrieves user settings from localStorage.
 * Returns default settings if none exist or on error.
 *
 * @returns Settings object with all user preferences
 *
 * @example
 * const settings = getSettings();
 * if (settings.autoMatchWeight) {
 *   console.log('Auto-match weight is enabled');
 * }
 */
export function getSettings(): Settings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { autoMatchWeight: false };
  } catch {
    return { autoMatchWeight: false };
  }
}

/**
 * Saves user settings to localStorage.
 * Overwrites existing settings.
 *
 * @param settings - Settings object to save
 *
 * @example
 * const settings = getSettings();
 * saveSettings({ ...settings, autoMatchWeight: true });
 */
export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

/**
 * Converts raw stored JSON strings into canonical export values for known migrated keys.
 *
 * @param key - Storage key being exported
 * @param value - Raw string value from localStorage
 * @returns Canonical JSON string for export
 */
function normalizeStoredExportValue(key: string, value: string): string {
  const parsedValue = parseJsonString(value);

  if (parsedValue === undefined) {
    return value;
  }

  switch (key) {
    case STORAGE_KEYS.TEMPLATES:
      return JSON.stringify(normalizeTemplates(parsedValue));
    case STORAGE_KEYS.DRAFT_TEMPLATE: {
      const draft = normalizeTemplateDraft(parsedValue);
      return JSON.stringify(draft);
    }
    case STORAGE_KEYS.ACTIVE_WORKOUT: {
      const workout = normalizeActiveWorkout(parsedValue);
      return JSON.stringify(workout);
    }
    default:
      return value;
  }
}

/**
 * Orders imported storage keys so template data is restored before dependent records.
 *
 * @param data - Raw imported storage map
 * @returns Keys in the order they should be restored
 */
function getImportStorageOrder(data: Record<string, string>): string[] {
  const prioritizedKeys = [
    STORAGE_KEYS.TEMPLATES,
    STORAGE_KEYS.DRAFT_TEMPLATE,
    STORAGE_KEYS.ACTIVE_WORKOUT,
  ];

  return [
    ...prioritizedKeys.filter((key) => key in data),
    ...Object.keys(data).filter(
      (key) => !prioritizedKeys.some((prioritizedKey) => prioritizedKey === key)
    ),
  ];
}

/**
 * Converts imported storage entries into canonical persisted values.
 *
 * @param key - Storage key being imported
 * @param value - Raw imported JSON string
 * @returns Normalized string value, or null when the key should be omitted
 */
function normalizeStoredImportValue(key: string, value: string): string | null {
  const normalizedValue = normalizeStoredExportValue(key, value);

  if (
    normalizedValue === "null" &&
    (key === STORAGE_KEYS.DRAFT_TEMPLATE || key === STORAGE_KEYS.ACTIVE_WORKOUT)
  ) {
    return null;
  }

  return normalizedValue;
}

/**
 * Exports all Zenith application data from localStorage.
 * Automatically discovers and exports all keys prefixed with "zenith_".
 * Includes metadata for version compatibility and future-proofing.
 *
 * @returns JSON string containing all application data with metadata
 *
 * @example
 * const exportData = exportAllData();
 * downloadDataFile(exportData);
 */
export function exportAllData(): string {
  const data: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("zenith_")) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        data[key] = normalizeStoredExportValue(key, value);
      }
    }
  }

  const exportObject = {
    version: "1.0",
    appName: "Zenith",
    exportDate: new Date().toISOString(),
    data: data,
  };

  return JSON.stringify(exportObject, null, 2);
}

/**
 * Imports application data from a JSON string and replaces all existing data.
 * Validates the data structure and clears all existing zenith_* keys before importing.
 *
 * @param jsonString - JSON string containing exported data
 * @throws Error if JSON is invalid or data structure is incorrect
 *
 * @example
 * const fileContent = await file.text();
 * importAllData(fileContent);
 */
export function importAllData(jsonString: string): void {
  let importObject: {
    version: string;
    appName: string;
    exportDate: string;
    data: Record<string, string>;
  };

  try {
    importObject = JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing import file:", error);
    throw new Error("Invalid JSON file. Please select a valid Zenith backup file.");
  }

  if (!importObject.version || !importObject.appName || !importObject.data) {
    throw new Error("Invalid backup file format. Missing required fields.");
  }

  if (importObject.appName !== "Zenith") {
    throw new Error("This file is not a valid Zenith backup.");
  }

  if (importObject.version !== "1.0") {
    console.warn(`Importing data from version ${importObject.version}`);
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("zenith_")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  try {
    getImportStorageOrder(importObject.data).forEach((key) => {
      const normalizedValue = normalizeStoredImportValue(key, importObject.data[key]);

      if (normalizedValue !== null) {
        localStorage.setItem(key, normalizedValue);
      }
    });
  } catch (error) {
    console.error("Error writing imported data to localStorage:", error);
    throw new Error(
      "Failed to import data. Your storage may be full or the data may be too large."
    );
  }
}

/**
 * Triggers a browser download of the provided data as a JSON file.
 * Filename format: zenith-backup-YYYY-MM-DD.json
 *
 * @param jsonString - JSON string to download
 *
 * @example
 * const data = exportAllData();
 * downloadDataFile(data);
 */
export function downloadDataFile(jsonString: string): void {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const today = new Date().toISOString().split("T")[0];
  link.download = `zenith-backup-${today}.json`;
  link.href = url;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Checks if there is currently an active workout in progress.
 * Used to warn users before destructive operations like data import.
 *
 * @returns True if an active workout exists, false otherwise
 *
 * @example
 * if (hasActiveWorkout()) {
 *   alert('You have an active workout that will be lost!');
 * }
 */
export function hasActiveWorkout(): boolean {
  return getActiveWorkout() !== null;
}

/**
 * Gets the workout history for a specific exercise.
 * Returns all completed workouts containing the exercise in reverse chronological order.
 *
 * @param exerciseId - The ID of the exercise to find
 * @returns Array of workouts containing this exercise, sorted by date (newest first)
 *
 * @example
 * const history = getExerciseHistory("exercise-123");
 * if (history.length > 0) {
 *   console.log(`Exercise performed in ${history.length} workouts`);
 * }
 */
export function getExerciseHistory(exerciseId: string): Workout[] {
  const workouts = getWorkouts();

  const workoutsWithExercise = workouts.filter(
    (workout) => workout.completed && workout.exercises.some((ex) => ex.exerciseId === exerciseId)
  );

  return workoutsWithExercise.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
