import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { BottomTabBar } from "./BottomTabBar";

function RouteStateViewer() {
  const location = useLocation();

  return <div data-testid="location-path">{location.pathname}</div>;
}

function AppShell() {
  return (
    <>
      <RouteStateViewer />
      <Routes>
        <Route path="/exercises" element={<div>Exercises</div>} />
        <Route path="/templates" element={<div>Templates</div>} />
        <Route path="/templates/edit/:id" element={<div>Template Editor</div>} />
        <Route path="/workout" element={<div>Workout</div>} />
        <Route path="/history" element={<div>History</div>} />
        <Route path="/history/workout/:workoutId" element={<div>Workout Detail</div>} />
        <Route path="/more" element={<div>More</div>} />
        <Route path="/more/settings" element={<div>Settings</div>} />
      </Routes>
      <BottomTabBar />
    </>
  );
}

function renderBottomTabBar(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell />
    </MemoryRouter>
  );
}

describe("BottomTabBar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("restores the last visited sub-route when returning to a tab", async () => {
    renderBottomTabBar("/templates/edit/template-1");

    fireEvent.click(screen.getByLabelText("History"));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/history");
    });

    fireEvent.click(screen.getByLabelText("Templates"));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/templates/edit/template-1");
    });
  });

  it("navigates an active sub-route tab back to its base path and scrolls to top", async () => {
    renderBottomTabBar("/history/workout/workout-1");

    fireEvent.click(screen.getByLabelText("History"));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/history");
    });

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("scrolls to top without navigating when clicking the active simple tab", () => {
    renderBottomTabBar("/workout");

    fireEvent.click(screen.getByLabelText("Workout"));

    expect(screen.getByTestId("location-path").textContent).toBe("/workout");
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });
});
