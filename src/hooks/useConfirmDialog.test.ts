import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { useConfirmDialog } from "./useConfirmDialog";

describe("useConfirmDialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("starts closed and closes again through the forwarded cancel handler", () => {
    const { result } = renderHook(() => useConfirmDialog());

    expect(result.current.dialogProps.isOpen).toBe(false);
    expect(result.current.dialogProps.title).toBe("");

    act(() => {
      result.current.showConfirm({
        title: "Delete workout?",
        onConfirm: vi.fn(),
      });
    });

    expect(result.current.dialogProps.isOpen).toBe(true);
    expect(result.current.dialogProps.title).toBe("Delete workout?");

    act(() => {
      result.current.dialogProps.onCancel();
    });

    expect(result.current.dialogProps.isOpen).toBe(false);
  });

  it("forwards dialog options to the rendered ConfirmDialog props", () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      result.current.showConfirm({
        title: "Delete template?",
        message: "This cannot be undone.",
        confirmText: "Delete",
        cancelText: "Keep",
        variant: "danger",
        checkboxLabel: "Delete draft too",
        checkboxDefaultChecked: true,
        onConfirm,
      });
    });

    expect(result.current.dialogProps).toMatchObject({
      isOpen: true,
      title: "Delete template?",
      message: "This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Keep",
      variant: "danger",
      checkboxLabel: "Delete draft too",
      checkboxDefaultChecked: true,
    });
    expect(result.current.dialogProps.onConfirm).toBe(onConfirm);
  });
});
