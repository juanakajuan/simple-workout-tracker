import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import type { ReactNode } from "react";

vi.mock("./components/BottomTabBar", () => ({
  BottomTabBar: () => <div data-testid="bottom-tab-bar">BottomTabBar</div>,
}));

vi.mock("./hooks/useAppDialog", () => ({
  AppDialogProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./pages/ExercisesPage", () => ({
  ExercisesPage: () => <div>ExercisesPage</div>,
}));

vi.mock("./pages/TemplatesPage", () => ({
  TemplatesPage: () => <div>TemplatesPage</div>,
}));

vi.mock("./pages/TemplateEditorPage", () => ({
  TemplateEditorPage: () => <div>TemplateEditorPage</div>,
}));

vi.mock("./pages/WorkoutPage", () => ({
  WorkoutPage: () => <div>WorkoutPage</div>,
}));

vi.mock("./pages/HistoryPage", () => ({
  HistoryPage: () => <div>HistoryPage</div>,
}));

vi.mock("./pages/WeeklySetsTrackerPage", () => ({
  WeeklySetsTrackerPage: () => <div>WeeklySetsTrackerPage</div>,
}));

vi.mock("./pages/MorePage", () => ({
  MorePage: () => <div>MorePage</div>,
}));

vi.mock("./pages/SettingsPage", () => ({
  SettingsPage: () => <div>SettingsPage</div>,
}));

vi.mock("./pages/ExerciseFormPage", () => ({
  ExerciseFormPage: () => <div>ExerciseFormPage</div>,
}));

vi.mock("./pages/ExerciseHistoryPage", () => ({
  ExerciseHistoryPage: () => <div>ExerciseHistoryPage</div>,
}));

vi.mock("./pages/ExerciseSelectorPage", () => ({
  ExerciseSelectorPage: () => <div>ExerciseSelectorPage</div>,
}));

vi.mock("./pages/MuscleGroupSelectorPage", () => ({
  MuscleGroupSelectorPage: () => <div>MuscleGroupSelectorPage</div>,
}));

vi.mock("./pages/WorkoutDetailPage", () => ({
  WorkoutDetailPage: () => <div>WorkoutDetailPage</div>,
}));

import App from "./App";

function renderAt(pathname: string) {
  window.history.replaceState({}, "", pathname);
  return render(<App />);
}

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each([
    ["/exercises", "ExercisesPage"],
    ["/exercises/new", "ExerciseFormPage"],
    ["/exercises/edit/exercise-1", "ExerciseFormPage"],
    ["/exercises/history/exercise-1", "ExerciseHistoryPage"],
    ["/templates", "TemplatesPage"],
    ["/templates/new", "TemplateEditorPage"],
    ["/templates/new/select-exercise", "ExerciseSelectorPage"],
    ["/templates/new/select-exercise/new", "ExerciseFormPage"],
    ["/templates/new/select-muscle-group", "MuscleGroupSelectorPage"],
    ["/templates/edit/template-1", "TemplateEditorPage"],
    ["/templates/edit/template-1/select-exercise", "ExerciseSelectorPage"],
    ["/templates/edit/template-1/select-exercise/new", "ExerciseFormPage"],
    ["/templates/edit/template-1/select-muscle-group", "MuscleGroupSelectorPage"],
    ["/workout", "WorkoutPage"],
    ["/workout/select-exercise", "ExerciseSelectorPage"],
    ["/workout/select-exercise/new", "ExerciseFormPage"],
    ["/workout/history/exercise-1", "ExerciseHistoryPage"],
    ["/history", "HistoryPage"],
    ["/history/weekly-sets", "WeeklySetsTrackerPage"],
    ["/history/workout/workout-1", "WorkoutDetailPage"],
    ["/history/workout/workout-1/exercise/exercise-1", "ExerciseHistoryPage"],
    ["/more", "MorePage"],
    ["/more/settings", "SettingsPage"],
  ])("renders %s with the expected page component", (pathname, pageName) => {
    renderAt(pathname);

    expect(screen.getByText(pageName)).toBeDefined();
    expect(screen.getByTestId("bottom-tab-bar")).toBeDefined();
  });

  it("redirects / to /exercises", async () => {
    renderAt("/");

    await waitFor(() => {
      expect(screen.getByText("ExercisesPage")).toBeDefined();
      expect(window.location.pathname).toBe("/exercises");
    });
  });
});
