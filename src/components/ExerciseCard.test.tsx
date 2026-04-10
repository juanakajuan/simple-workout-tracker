import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { Exercise } from "../types";

import { ExerciseCard } from "./ExerciseCard";

function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: overrides.id ?? "exercise-1",
    name: overrides.name ?? "Cable Row",
    muscleGroup: overrides.muscleGroup ?? "back",
    exerciseType: overrides.exerciseType ?? "cable",
    notes: overrides.notes ?? "Pause at peak contraction",
  };
}

describe("ExerciseCard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders default and last-performed badges", () => {
    render(<ExerciseCard exercise={createExercise()} isDefault lastPerformed="yesterday" />);

    expect(screen.getByText("Default")).toBeDefined();
    expect(screen.getByText("Last performed yesterday")).toBeDefined();
    expect(screen.getByText("Pause at peak contraction")).toBeDefined();
  });

  it("opens and closes the edit menu while preventing click propagation", () => {
    const onClick = vi.fn();
    const onEdit = vi.fn();

    render(<ExerciseCard exercise={createExercise()} onClick={onClick} onEdit={onEdit} />);

    fireEvent.click(screen.getByText("Cable Row"));
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /exercise options/i }));
    expect(screen.getByRole("button", { name: /edit exercise/i })).toBeDefined();
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("button", { name: /edit exercise/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /exercise options/i }));
    fireEvent.click(screen.getByRole("button", { name: /edit exercise/i }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /edit exercise/i })).toBeNull();
  });
});
