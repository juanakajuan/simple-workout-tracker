import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

import { AlertDialog } from "./AlertDialog";

describe("AlertDialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("closes on Escape, Enter, and overlay click", () => {
    const onClose = vi.fn();
    const { container } = render(<AlertDialog isOpen title="Warning" onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.click(container.querySelector(".modal-overlay") as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("renders the requested variant and cleans up body scroll lock", () => {
    const { container, rerender, unmount } = render(
      <AlertDialog isOpen title="Warning" variant="warning" onClose={vi.fn()} />
    );

    expect(container.querySelector(".alert-dialog-icon.warning")).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<AlertDialog isOpen={false} title="Warning" variant="warning" onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("");

    rerender(<AlertDialog isOpen title="Warning" variant="danger" onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
