import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ConfirmDialog } from "./ConfirmDialog";

type ConfirmDialogProperties = ComponentProps<typeof ConfirmDialog>;

/**
 * Renders the dialog with stable defaults so each test overrides only what it needs.
 *
 * @param overrides Properties to override for the rendered dialog.
 * @returns The testing-library render result.
 */
function renderConfirmDialog(overrides: Partial<ConfirmDialogProperties> = {}) {
  const properties: ConfirmDialogProperties = {
    isOpen: true,
    title: "Delete this workout?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };

  return render(<ConfirmDialog {...properties} />);
}

describe("ConfirmDialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("cancels on Escape and overlay click", () => {
    const onCancel = vi.fn();
    const { container } = renderConfirmDialog({ onCancel });

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(container.querySelector(".modal-overlay") as HTMLElement);

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("passes checkbox state to confirm before cancelling", () => {
    const callbackSequence: string[] = [];
    const onConfirm = vi.fn((checked?: boolean) => {
      callbackSequence.push(`confirm:${String(checked)}`);
    });
    const onCancel = vi.fn(() => {
      callbackSequence.push("cancel");
    });

    renderConfirmDialog({
      checkboxLabel: "Delete the template too",
      onConfirm,
      onCancel,
    });

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith(true);
    expect(callbackSequence).toEqual(["confirm:true", "cancel"]);
  });

  it("resets the checkbox state when reopened", () => {
    const checkboxLabel = "Delete the template too";
    const { rerender } = renderConfirmDialog({ checkboxLabel });

    const confirmationCheckbox = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(confirmationCheckbox);
    expect(confirmationCheckbox.checked).toBe(true);

    rerender(<ConfirmDialog isOpen={false} title="Delete this workout?" checkboxLabel={checkboxLabel} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    rerender(<ConfirmDialog isOpen title="Delete this workout?" checkboxLabel={checkboxLabel} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });

  it("locks body scroll while open and cleans it up when closed", () => {
    const { rerender, unmount } = renderConfirmDialog();

    expect(document.body.style.overflow).toBe("hidden");

    rerender(<ConfirmDialog isOpen={false} title="Delete this workout?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.body.style.overflow).toBe("");

    rerender(<ConfirmDialog isOpen title="Delete this workout?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
