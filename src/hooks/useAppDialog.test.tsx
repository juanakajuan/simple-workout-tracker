import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, renderHook, screen, waitFor } from "@testing-library/react";

import type { ReactNode } from "react";

import { useAppDialog } from "./appDialogContext";
import { AppDialogProvider } from "./useAppDialog";

function Wrapper({ children }: { children: ReactNode }) {
  return <AppDialogProvider>{children}</AppDialogProvider>;
}

describe("AppDialogProvider", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows alerts and resolves their promise when closed", async () => {
    const { result } = renderHook(() => useAppDialog(), { wrapper: Wrapper });
    let promise!: Promise<void>;

    await act(async () => {
      promise = result.current.showAlert({
        title: "Heads up",
        message: "Alert body",
        buttonText: "Close now",
      });
    });

    expect(screen.getByRole("alertdialog", { name: /heads up/i })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /close now/i }));

    await expect(promise).resolves.toBeUndefined();
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog", { name: /heads up/i })).toBeNull();
    });
  });

  it("replaces an already-open alert and resolves the previous promise", async () => {
    const { result } = renderHook(() => useAppDialog(), { wrapper: Wrapper });
    let firstPromise!: Promise<void>;
    let firstResolved = false;

    await act(async () => {
      firstPromise = result.current.showAlert({ title: "First alert" });
    });

    firstPromise.then(() => {
      firstResolved = true;
    });

    await act(async () => {
      void result.current.showAlert({ title: "Second alert" });
    });

    await waitFor(() => {
      expect(firstResolved).toBe(true);
    });

    await expect(firstPromise).resolves.toBeUndefined();
    expect(screen.getByRole("alertdialog", { name: /second alert/i })).toBeDefined();
  });

  it("shows confirms and resolves with the confirmation result", async () => {
    const { result } = renderHook(() => useAppDialog(), { wrapper: Wrapper });
    let promise!: Promise<{ confirmed: boolean; checkboxChecked?: boolean }>;

    await act(async () => {
      promise = result.current.showConfirm({
        title: "Delete workout?",
        checkboxLabel: "Delete related notes",
      });
    });

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await expect(promise).resolves.toEqual({ confirmed: true, checkboxChecked: true });
  });

  it("replaces an already-open confirm and resolves the previous one as cancelled", async () => {
    const { result } = renderHook(() => useAppDialog(), { wrapper: Wrapper });
    let firstPromise!: Promise<{ confirmed: boolean; checkboxChecked?: boolean }>;
    let secondPromise!: Promise<{ confirmed: boolean; checkboxChecked?: boolean }>;

    await act(async () => {
      firstPromise = result.current.showConfirm({ title: "First confirm" });
    });

    await act(async () => {
      secondPromise = result.current.showConfirm({ title: "Second confirm" });
    });

    await expect(firstPromise).resolves.toEqual({ confirmed: false });
    expect(screen.getByText("Second confirm")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await expect(secondPromise).resolves.toEqual({ confirmed: false });
  });
});
