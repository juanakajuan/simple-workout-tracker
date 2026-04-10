import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { ReactNode } from "react";

import { PageHeader } from "./PageHeader";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderPageHeader(
  ui: ReactNode,
  options: { initialEntries?: string[]; initialIndex?: number } = {}
) {
  const { initialEntries = ["/current"], initialIndex } = options;

  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route path="/previous" element={<div>Previous Page</div>} />
        <Route path="/current" element={<>{ui}</>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PageHeader", () => {
  beforeEach(() => {
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("navigates back by default when the back button is clicked", async () => {
    renderPageHeader(<PageHeader title="Current Page" />, {
      initialEntries: ["/previous", "/current"],
      initialIndex: 1,
    });

    fireEvent.click(screen.getByRole("button", { name: /go back/i }));

    await waitFor(() => {
      expect(screen.getByText("Previous Page")).toBeDefined();
    });
  });

  it("calls a custom back handler instead of navigating", () => {
    const onBack = vi.fn();

    renderPageHeader(<PageHeader title="Current Page" onBack={onBack} />, {
      initialEntries: ["/previous", "/current"],
      initialIndex: 1,
    });

    fireEvent.click(screen.getByRole("button", { name: /go back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Current Page" })).toBeDefined();
    expect(screen.queryByText("Previous Page")).toBeNull();
  });

  it("renders string titles as a heading and custom nodes unchanged", () => {
    const { rerender } = render(
      <MemoryRouter>
        <PageHeader title="Workout" />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Workout" })).toBeDefined();

    rerender(
      <MemoryRouter>
        <PageHeader title={<div data-testid="custom-title">Custom Title</div>} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("custom-title").textContent).toBe("Custom Title");
    expect(screen.queryByRole("heading", { name: "Custom Title" })).toBeNull();
  });
});
