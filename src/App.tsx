/**
 * Root application component for Zenith.
 *
 * Sets up the main application structure including:
 * - BrowserRouter for client-side routing
 * - AppDialogProvider for global dialog state management
 * - Route definitions for all application pages
 * - BottomTabBar for primary navigation
 *
 * The routing structure supports the following URL patterns:
 * - /exercises - Exercise library management
 * - /templates - Workout template management
 * - /workout - Active workout tracking
 * - /history - Workout history and stats
 * - /more - Settings and data management
 *
 * @module App
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomTabBar } from "./components/BottomTabBar";
import { ExercisesPage } from "./pages/ExercisesPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { TemplateEditorPage } from "./pages/TemplateEditorPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { HistoryPage } from "./pages/HistoryPage";
import { WeeklySetsTrackerPage } from "./pages/WeeklySetsTrackerPage";
import { MorePage } from "./pages/MorePage";
import { SettingsPage } from "./pages/SettingsPage";
import { ExerciseFormPage } from "./pages/ExerciseFormPage";
import { ExerciseHistoryPage } from "./pages/ExerciseHistoryPage";
import { ExerciseSelectorPage } from "./pages/ExerciseSelectorPage";
import { MuscleGroupSelectorPage } from "./pages/MuscleGroupSelectorPage";
import { WorkoutDetailPage } from "./pages/WorkoutDetailPage";
import { AppDialogProvider } from "./hooks/useAppDialog";

/**
 * Main application component that defines the routing structure
 * and wraps the app with necessary providers.
 *
 * @returns The rendered application component
 */
export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <AppDialogProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/exercises" replace />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/new" element={<ExerciseFormPage />} />
          <Route path="/exercises/edit/:exerciseId" element={<ExerciseFormPage />} />
          <Route path="/exercises/history/:exerciseId" element={<ExerciseHistoryPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/new" element={<TemplateEditorPage />} />
          <Route path="/templates/new/select-exercise" element={<ExerciseSelectorPage />} />
          <Route path="/templates/new/select-exercise/new" element={<ExerciseFormPage />} />
          <Route path="/templates/new/select-muscle-group" element={<MuscleGroupSelectorPage />} />
          <Route path="/templates/edit/:id" element={<TemplateEditorPage />} />
          <Route path="/templates/edit/:id/select-exercise" element={<ExerciseSelectorPage />} />
          <Route path="/templates/edit/:id/select-exercise/new" element={<ExerciseFormPage />} />
          <Route
            path="/templates/edit/:id/select-muscle-group"
            element={<MuscleGroupSelectorPage />}
          />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/workout/select-exercise" element={<ExerciseSelectorPage />} />
          <Route path="/workout/select-exercise/new" element={<ExerciseFormPage />} />
          <Route path="/workout/history/:exerciseId" element={<ExerciseHistoryPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/weekly-sets" element={<WeeklySetsTrackerPage />} />
          <Route path="/history/workout/:workoutId" element={<WorkoutDetailPage />} />
          <Route
            path="/history/workout/:workoutId/exercise/:exerciseId"
            element={<ExerciseHistoryPage />}
          />
          <Route path="/more" element={<MorePage />} />
          <Route path="/more/settings" element={<SettingsPage />} />
        </Routes>
        <BottomTabBar />
      </AppDialogProvider>
    </BrowserRouter>
  );
}
