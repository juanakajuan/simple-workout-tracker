import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomTabBar } from "./components/BottomTabBar";
import { ExercisesPage } from "./pages/ExercisesPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { TemplateEditorPage } from "./pages/TemplateEditorPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { HistoryPage } from "./pages/HistoryPage";
import { MorePage } from "./pages/MorePage";
import { SettingsPage } from "./pages/SettingsPage";
import { ExerciseFormPage } from "./pages/ExerciseFormPage";
import { ExerciseHistoryPage } from "./pages/ExerciseHistoryPage";
import { ExerciseSelectorPage } from "./pages/ExerciseSelectorPage";
import { DaySelectorPage } from "./pages/DaySelectorPage";
import { DayEditorPage } from "./pages/DayEditorPage";
import { MuscleGroupSelectorPage } from "./pages/MuscleGroupSelectorPage";
import { WorkoutDetailPage } from "./pages/WorkoutDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/exercises" replace />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/new" element={<ExerciseFormPage />} />
        <Route path="/exercises/edit/:exerciseId" element={<ExerciseFormPage />} />
        <Route path="/exercises/history/:exerciseId" element={<ExerciseHistoryPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/select-day" element={<DaySelectorPage />} />
        <Route path="/templates/new" element={<TemplateEditorPage />} />
        <Route path="/templates/new/select-exercise" element={<ExerciseSelectorPage />} />
        <Route path="/templates/new/select-exercise/new" element={<ExerciseFormPage />} />
        <Route path="/templates/new/select-muscle-group" element={<MuscleGroupSelectorPage />} />
        <Route path="/templates/new/edit-days" element={<DayEditorPage />} />
        <Route path="/templates/edit/:id" element={<TemplateEditorPage />} />
        <Route path="/templates/edit/:id/select-exercise" element={<ExerciseSelectorPage />} />
        <Route path="/templates/edit/:id/select-exercise/new" element={<ExerciseFormPage />} />
        <Route
          path="/templates/edit/:id/select-muscle-group"
          element={<MuscleGroupSelectorPage />}
        />
        <Route path="/templates/edit/:id/edit-days" element={<DayEditorPage />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/workout/select-exercise" element={<ExerciseSelectorPage />} />
        <Route path="/workout/select-exercise/new" element={<ExerciseFormPage />} />
        <Route path="/workout/select-day" element={<DaySelectorPage />} />
        <Route path="/workout/history/:exerciseId" element={<ExerciseHistoryPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/workout/:workoutId" element={<WorkoutDetailPage />} />
        <Route
          path="/history/workout/:workoutId/exercise/:exerciseId"
          element={<ExerciseHistoryPage />}
        />
        <Route path="/more" element={<MorePage />} />
        <Route path="/more/settings" element={<SettingsPage />} />
      </Routes>
      <BottomTabBar />
    </BrowserRouter>
  );
}
