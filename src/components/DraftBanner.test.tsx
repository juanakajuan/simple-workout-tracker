import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { DraftBanner } from "./DraftBanner";

describe("DraftBanner", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("continues editing when the banner is clicked", () => {
    const onContinue = vi.fn();

    render(<DraftBanner onContinue={onContinue} onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByText("You have an unsaved template draft"));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("dismisses without triggering continue when the dismiss button is clicked", () => {
    const onContinue = vi.fn();
    const onDismiss = vi.fn();

    render(<DraftBanner onContinue={onContinue} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss draft/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });
});
