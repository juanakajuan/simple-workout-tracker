import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

import { useAppDialog } from "./appDialogContext";

describe("useAppDialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("throws when used outside AppDialogProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useAppDialog())).toThrowError(
      "useAppDialog must be used within an AppDialogProvider"
    );
  });
});
