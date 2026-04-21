import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  type RenderResult,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from "react-router-dom";

import { MuscleGroupSelectorPage } from "./MuscleGroupSelectorPage";

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function RouteStateViewer(): React.JSX.Element {
  const location = useLocation();

  return (
    <div>
      <div data-testid="location-path">{location.pathname}</div>
      <pre data-testid="location-state">{JSON.stringify(location.state ?? null)}</pre>
    </div>
  );
}

function renderMuscleGroupSelector(initialEntry: InitialEntry): RenderResult {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/templates/new" element={<RouteStateViewer />} />
        <Route path="/templates/new/select-muscle-group" element={<MuscleGroupSelectorPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function getButtonByText(text: string): HTMLButtonElement {
  return screen.getByText(text).closest("button") as HTMLButtonElement;
}

function getCategoryElement(categoryName: string): HTMLElement {
  return screen.getByRole("heading", { name: categoryName }).closest(
    ".muscle-group-category"
  ) as HTMLElement;
}

/** Simulates a touch tap plus the browser's follow-up click event. */
function simulateTouchTap(element: HTMLElement, pointerId: number, clientOffset: number): void {
  fireEvent.pointerDown(element, {
    pointerType: "touch",
    pointerId,
    clientX: clientOffset,
    clientY: clientOffset,
  });
  fireEvent.pointerUp(element, {
    pointerType: "touch",
    pointerId,
    clientX: clientOffset,
    clientY: clientOffset,
  });
  fireEvent.click(element, { detail: 1 });
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

    const chestButton = getButtonByText("Chest");
    const backButton = getButtonByText("Back");

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

    const upperPushCategory = getCategoryElement("Upper Push");
    const selectAllButton = within(upperPushCategory).getByRole("button", { name: "Select All" });

    fireEvent.click(selectAllButton);

    expect(within(upperPushCategory).getByRole("button", { name: "Deselect All" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Add 3 Muscle Groups" })).toBeDefined();
    expect(getButtonByText("Chest").ariaPressed).toBe("true");
    expect(getButtonByText("Triceps").ariaPressed).toBe("true");
    expect(getButtonByText("Shoulders").ariaPressed).toBe("true");

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

    const backButton = getButtonByText("Back");
    const upperPullCategory = getCategoryElement("Upper Pull");
    const selectAllButton = within(upperPullCategory).getByRole("button", { name: "Select All" });

    simulateTouchTap(backButton, 1, 10);

    expect(backButton.getAttribute("aria-pressed")).toBe("true");

    simulateTouchTap(selectAllButton, 2, 20);

    expect(backButton.getAttribute("aria-pressed")).toBe("true");
    expect(getButtonByText("Biceps").ariaPressed).toBe("true");
    expect(within(upperPullCategory).getByRole("button", { name: "Deselect All" })).toBeDefined();
  });
});
