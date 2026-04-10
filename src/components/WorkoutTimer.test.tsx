import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

import { WorkoutTimer } from "./WorkoutTimer";

describe("WorkoutTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calculates initial elapsed time, formats it, and ticks every second", () => {
    vi.setSystemTime(new Date("2026-01-01T13:01:05.000Z"));

    render(<WorkoutTimer startTime="2026-01-01T12:00:00.000Z" />);

    expect(screen.getByText("1:01:05")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("1:01:07")).toBeDefined();
  });

  it("cleans up its interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    vi.setSystemTime(new Date("2026-01-01T12:00:10.000Z"));

    const { unmount } = render(<WorkoutTimer startTime="2026-01-01T12:00:00.000Z" />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });
});
