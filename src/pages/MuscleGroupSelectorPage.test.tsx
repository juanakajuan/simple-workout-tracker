import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";

import { MuscleGroupSelectorPage } from "./MuscleGroupSelectorPage";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function RouteStateViewer() {
  const location = useLocation();

  return (
    <div>
      <div data-testid="location-path">{location.pathname}</div>
      <pre data-testid="location-state">{JSON.stringify(location.state ?? null)}</pre>
    </div>
  );
}

function renderMuscleGroupSelector(initialEntry: InitialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/templates/new" element={<RouteStateViewer />} />
        <Route path="/templates/new/select-muscle-group" element={<MuscleGroupSelectorPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MuscleGroupSelectorPage", () => {
  beforeEach(() => {
    window.ResizeObserver = MockResizeObserver;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      font: "",
      measureText: () => ({ width: 80 }),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("toggles groups, shows already-added badges, and confirms selected state", async () => {
    renderMuscleGroupSelector({
      pathname: "/templates/new/select-muscle-group",
      key: "confirm-state",
      state: { existingMuscleGroups: ["chest", "biceps"] },
    });

    const chestButton = screen.getByText("Chest").closest("button") as HTMLButtonElement;
    const backButton = screen.getByText("Back").closest("button") as HTMLButtonElement;

    expect(screen.getAllByText("Added")).toHaveLength(2);
    expect(chestButton.getAttribute("aria-pressed")).toBe("true");
    expect(backButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(chestButton);
    fireEvent.click(backButton);

    expect(chestButton.getAttribute("aria-pressed")).toBe("false");
    expect(backButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Add 2 Muscle Groups" }));

    await waitFor(() => {
      expect(screen.getByTestId("location-path").textContent).toBe("/templates/new");
    });

    expect(JSON.parse(screen.getByTestId("location-state").textContent ?? "null")).toEqual({
      selectedMuscleGroups: ["biceps", "back"],
    });
  });

  it("selects and deselects all groups in a category", () => {
    renderMuscleGroupSelector({
      pathname: "/templates/new/select-muscle-group",
      key: "select-all",
    });

    const upperPushCategory = screen
      .getByRole("heading", { name: "Upper Push" })
      .closest(".muscle-group-category") as HTMLElement;
    const selectAllButton = within(upperPushCategory).getByRole("button", { name: "Select All" });

    fireEvent.click(selectAllButton);

    expect(within(upperPushCategory).getByRole("button", { name: "Deselect All" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Add 3 Muscle Groups" })).toBeDefined();
    expect((screen.getByText("Chest").closest("button") as HTMLButtonElement).ariaPressed).toBe(
      "true"
    );
    expect((screen.getByText("Triceps").closest("button") as HTMLButtonElement).ariaPressed).toBe(
      "true"
    );
    expect((screen.getByText("Shoulders").closest("button") as HTMLButtonElement).ariaPressed).toBe(
      "true"
    );

    fireEvent.click(within(upperPushCategory).getByRole("button", { name: "Deselect All" }));

    expect(within(upperPushCategory).getByRole("button", { name: "Select All" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Add 0 Muscle Groups" }).hasAttribute("disabled")
    ).toBe(true);
  });

  it("deduplicates touch pointer interactions from the follow-up click", () => {
    renderMuscleGroupSelector({
      pathname: "/templates/new/select-muscle-group",
      key: "touch-dedup",
    });

    const backButton = screen.getByText("Back").closest("button") as HTMLButtonElement;
    const upperPullCategory = screen
      .getByRole("heading", { name: "Upper Pull" })
      .closest(".muscle-group-category") as HTMLElement;
    const selectAllButton = within(upperPullCategory).getByRole("button", { name: "Select All" });

    fireEvent.pointerDown(backButton, {
      pointerType: "touch",
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerUp(backButton, {
      pointerType: "touch",
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.click(backButton, { detail: 1 });

    expect(backButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.pointerDown(selectAllButton, {
      pointerType: "touch",
      pointerId: 2,
      clientX: 20,
      clientY: 20,
    });
    fireEvent.pointerUp(selectAllButton, {
      pointerType: "touch",
      pointerId: 2,
      clientX: 20,
      clientY: 20,
    });
    fireEvent.click(selectAllButton, { detail: 1 });

    expect(backButton.getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByText("Biceps").closest("button") as HTMLButtonElement).ariaPressed).toBe(
      "true"
    );
    expect(within(upperPullCategory).getByRole("button", { name: "Deselect All" })).toBeDefined();
  });
});
