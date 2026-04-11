import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("cancels on Escape and overlay click", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog isOpen title="Delete this workout?" onConfirm={vi.fn()} onCancel={onCancel} />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(container.querySelector(".modal-overlay") as HTMLElement);

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("passes checkbox state to confirm before cancelling", () => {
    const calls: string[] = [];
    const onConfirm = vi.fn((checked?: boolean) => {
      calls.push(`confirm:${String(checked)}`);
    });
    const onCancel = vi.fn(() => {
      calls.push("cancel");
    });

    render(
      <ConfirmDialog
        isOpen
        title="Delete this workout?"
        checkboxLabel="Delete the template too"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith(true);
    expect(calls).toEqual(["confirm:true", "cancel"]);
  });

  it("resets the checkbox state when reopened", () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen
        title="Delete this workout?"
        checkboxLabel="Delete the template too"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);

    rerender(
      <ConfirmDialog
        isOpen={false}
        title="Delete this workout?"
        checkboxLabel="Delete the template too"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    rerender(
      <ConfirmDialog
        isOpen
        title="Delete this workout?"
        checkboxLabel="Delete the template too"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });

  it("locks body scroll while open and cleans it up when closed", () => {
    const { rerender, unmount } = render(
      <ConfirmDialog isOpen title="Delete this workout?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <ConfirmDialog
        isOpen={false}
        title="Delete this workout?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(document.body.style.overflow).toBe("");

    rerender(
      <ConfirmDialog isOpen title="Delete this workout?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
