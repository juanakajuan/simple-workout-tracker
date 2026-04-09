import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { WorkoutSet } from "../types";
import { SetRow } from "./SetRow";

function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: overrides.id ?? "set-1",
    weight: overrides.weight ?? 0,
    reps: overrides.reps ?? 0,
    completed: overrides.completed ?? false,
    skipped: overrides.skipped ?? false,
  };
}

describe("SetRow", () => {
  afterEach(() => {
    cleanup();
  });

  it("requires both weight and reps before a weighted set can be completed", () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();

    const { container, rerender } = render(
      <SetRow
        set={createSet({ weight: 0, reps: 8 })}
        onUpdate={onUpdate}
        onRemove={onRemove}
        canRemove={true}
        exerciseType="machine"
        placeholderWeight={135}
        placeholderReps={10}
      />
    );

    const weightInput = container.querySelector<HTMLInputElement>(".set-weight input");
    const repsInput = container.querySelector<HTMLInputElement>(".set-reps input");
    const checkbox = screen.getByRole("button", { name: "Mark complete" }) as HTMLButtonElement;

    expect(weightInput?.placeholder).toBe("135");
    expect(repsInput?.placeholder).toBe("10");
    expect(checkbox.disabled).toBe(true);

    fireEvent.change(weightInput!, { target: { value: "135" } });
    expect(onUpdate).toHaveBeenCalledWith({ weight: 135 });

    rerender(
      <SetRow
        set={createSet({ weight: 135, reps: 8 })}
        onUpdate={onUpdate}
        onRemove={onRemove}
        canRemove={true}
        exerciseType="machine"
        placeholderWeight={135}
        placeholderReps={10}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(onUpdate).toHaveBeenLastCalledWith({ completed: true, skipped: false });
  });

  it("toggles skipped state through the menu and disables editing while skipped", () => {
    const onUpdate = vi.fn();

    const { container, rerender } = render(
      <SetRow
        set={createSet({ weight: 100, reps: 10 })}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        canRemove={true}
        exerciseType="machine"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Set options" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip set" }));

    expect(onUpdate).toHaveBeenCalledWith({ skipped: true, completed: false });
    expect(screen.queryByRole("button", { name: "Skip set" })).toBeNull();

    rerender(
      <SetRow
        set={createSet({ weight: 100, reps: 10, skipped: true })}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        canRemove={true}
        exerciseType="machine"
      />
    );

    const weightInput = container.querySelector<HTMLInputElement>(".set-weight input");
    const repsInput = container.querySelector<HTMLInputElement>(".set-reps input");
    const checkbox = screen.getByRole("button", { name: "Mark complete" }) as HTMLButtonElement;

    expect(weightInput?.disabled).toBe(true);
    expect(repsInput?.disabled).toBe(true);
    expect(checkbox.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Set options" }));
    fireEvent.click(screen.getByRole("button", { name: "Unskip set" }));

    expect(onUpdate).toHaveBeenLastCalledWith({ skipped: false });
  });

  it("only removes a set when deletion is allowed", () => {
    const onRemove = vi.fn();

    const blockedView = render(
      <SetRow
        set={createSet({ weight: 100, reps: 10 })}
        onUpdate={vi.fn()}
        onRemove={onRemove}
        canRemove={false}
        exerciseType="machine"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Set options" }));
    const blockedDeleteButton = screen.getByRole("button", {
      name: "Delete set",
    }) as HTMLButtonElement;

    expect(blockedDeleteButton.disabled).toBe(true);
    fireEvent.click(blockedDeleteButton);
    expect(onRemove).not.toHaveBeenCalled();

    blockedView.unmount();

    render(
      <SetRow
        set={createSet({ weight: 100, reps: 10 })}
        onUpdate={vi.fn()}
        onRemove={onRemove}
        canRemove={true}
        exerciseType="machine"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Set options" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete set" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Delete set" })).toBeNull();
  });

  it("uses reps-only completion rules for bodyweight sets and hides the weight input", () => {
    const onUpdate = vi.fn();

    const { container, rerender } = render(
      <SetRow
        set={createSet({ weight: 0, reps: 0 })}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        canRemove={true}
        exerciseType="bodyweight"
        placeholderReps={15}
      />
    );

    expect(container.querySelector(".set-weight input")).toBeNull();
    expect(
      (screen.getByRole("button", { name: "Mark complete" }) as HTMLButtonElement).disabled
    ).toBe(true);

    const repsInput = container.querySelector<HTMLInputElement>(".set-reps input");
    expect(repsInput?.placeholder).toBe("15");

    fireEvent.change(repsInput!, { target: { value: "15" } });
    expect(onUpdate).toHaveBeenCalledWith({ reps: 15 });

    rerender(
      <SetRow
        set={createSet({ weight: 0, reps: 15 })}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        canRemove={true}
        exerciseType="bodyweight"
        placeholderReps={15}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(onUpdate).toHaveBeenLastCalledWith({ completed: true, skipped: false });
  });
});
