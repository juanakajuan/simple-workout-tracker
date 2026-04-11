import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ToggleSwitch } from "./ToggleSwitch";

describe("ToggleSwitch", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("toggles from clicks and keyboard interaction", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ToggleSwitch checked={false} label="Auto match weight" onChange={onChange} />
    );

    const toggle = screen.getByRole("switch", { name: "Auto match weight" });

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenNthCalledWith(1, true);

    rerender(<ToggleSwitch checked label="Auto match weight" onChange={onChange} />);

    fireEvent.keyDown(toggle, { key: "Enter" });
    fireEvent.keyDown(toggle, { key: " " });

    expect(onChange).toHaveBeenNthCalledWith(2, false);
    expect(onChange).toHaveBeenNthCalledWith(3, false);
  });

  it("does not toggle when disabled", () => {
    const onChange = vi.fn();

    render(<ToggleSwitch checked={false} label="Auto match weight" onChange={onChange} disabled />);

    const toggle = screen.getByRole("switch", { name: "Auto match weight" }) as HTMLButtonElement;

    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: "Enter" });
    fireEvent.keyDown(toggle, { key: " " });

    expect(toggle.disabled).toBe(true);
    expect(toggle.className).toContain("disabled");
    expect(onChange).not.toHaveBeenCalled();
  });
});
