import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const {
  mockShowAlert,
  mockShowConfirm,
  mockExportAllData,
  mockImportAllData,
  mockDownloadDataFile,
  mockReloadPage,
  mockHasActiveWorkout,
  mockHasUnseenAppUpdate,
  mockMarkCurrentBuildAsSeen,
  mockFormatBuildTimestamp,
} = vi.hoisted(() => ({
  mockShowAlert: vi.fn(),
  mockShowConfirm: vi.fn(),
  mockExportAllData: vi.fn(),
  mockImportAllData: vi.fn(),
  mockDownloadDataFile: vi.fn(),
  mockReloadPage: vi.fn(),
  mockHasActiveWorkout: vi.fn(),
  mockHasUnseenAppUpdate: vi.fn(),
  mockMarkCurrentBuildAsSeen: vi.fn(),
  mockFormatBuildTimestamp: vi.fn(),
}));

vi.mock("../hooks/appDialogContext", () => ({
  useAppDialog: () => ({
    showAlert: mockShowAlert,
    showConfirm: mockShowConfirm,
  }),
}));

vi.mock("../utils/storage", () => ({
  exportAllData: mockExportAllData,
  importAllData: mockImportAllData,
  downloadDataFile: mockDownloadDataFile,
  hasActiveWorkout: mockHasActiveWorkout,
}));

vi.mock("../utils/browser", () => ({
  reloadPage: mockReloadPage,
}));

vi.mock("../utils/appRelease", () => ({
  APP_RELEASE: {
    version: "9.9.9",
    buildId: "build-123",
    gitSha: "deadbeef",
    builtAt: "2026-04-07T10:15:00.000Z",
  },
  formatBuildTimestamp: mockFormatBuildTimestamp,
  hasUnseenAppUpdate: mockHasUnseenAppUpdate,
  markCurrentBuildAsSeen: mockMarkCurrentBuildAsSeen,
}));

import { MorePage } from "./MorePage";

/** Renders the More page under the route paths used in these tests. */
function renderMorePage(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={["/more"]}>
      <Routes>
        <Route path="/more" element={<MorePage />} />
        <Route path="/more/settings" element={<div>Settings Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

type FileInputSpy = {
  input: HTMLInputElement;
  createElementSpy: ReturnType<typeof vi.spyOn>;
};

/** Replaces `document.createElement("input")` with a controllable file input. */
function createFileInputSpy(): FileInputSpy {
  const originalCreateElement = document.createElement.bind(document);
  const input = {
    type: "",
    accept: "",
    onchange: null,
    click: vi.fn(),
  } as unknown as HTMLInputElement;

  const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions
  ) => {
    if (tagName === "input") {
      return input;
    }

    return originalCreateElement(tagName, options);
  }) as typeof document.createElement);

  return { input, createElementSpy };
}

/** Attaches a selected backup file to the mocked file input. */
function setSelectedFile(input: HTMLInputElement, file: { text: () => Promise<string> }): void {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file],
  });
}

describe("MorePage", () => {
  beforeEach(() => {
    window.ResizeObserver = MockResizeObserver;
    mockShowAlert.mockReset().mockResolvedValue(undefined);
    mockShowConfirm.mockReset();
    mockExportAllData.mockReset().mockReturnValue('{"data":{}}');
    mockImportAllData.mockReset();
    mockDownloadDataFile.mockReset();
    mockReloadPage.mockReset();
    mockHasActiveWorkout.mockReset().mockReturnValue(false);
    mockHasUnseenAppUpdate.mockReset().mockReturnValue(false);
    mockMarkCurrentBuildAsSeen.mockReset();
    mockFormatBuildTimestamp.mockReset().mockReturnValue("Apr 7, 2026, 10:15:00 AM");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("exports all stored data into a backup download", async () => {
    renderMorePage();

    fireEvent.click(screen.getByRole("button", { name: /export data/i }));

    await waitFor(() => {
      expect(mockExportAllData).toHaveBeenCalledTimes(1);
    });

    expect(mockDownloadDataFile).toHaveBeenCalledWith('{"data":{}}');
    expect(mockMarkCurrentBuildAsSeen).toHaveBeenCalledTimes(1);
  });

  it("shows the active-workout warning and stops import when the user cancels", async () => {
    mockHasActiveWorkout.mockReturnValue(true);
    mockShowConfirm.mockResolvedValueOnce({ confirmed: false });

    const { createElementSpy } = createFileInputSpy();

    renderMorePage();

    fireEvent.click(screen.getByRole("button", { name: /import data/i }));

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledTimes(1);
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Replace active workout?",
        confirmText: "Continue",
        variant: "danger",
      })
    );
    expect(createElementSpy).not.toHaveBeenCalledWith("input");
  });

  it("creates a JSON file picker, imports the selected backup, and reloads the page", async () => {
    mockHasActiveWorkout.mockReturnValue(true);
    mockShowConfirm
      .mockResolvedValueOnce({ confirmed: true })
      .mockResolvedValueOnce({ confirmed: true });

    const { input } = createFileInputSpy();

    renderMorePage();

    fireEvent.click(screen.getByRole("button", { name: /import data/i }));

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledTimes(2);
      expect(input.click).toHaveBeenCalledTimes(1);
    });

    expect(input.type).toBe("file");
    expect(input.accept).toBe(".json");
    expect(mockShowConfirm).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        title: "Replace all data?",
        confirmText: "Import",
        variant: "danger",
      })
    );

    const file = {
      text: vi.fn().mockResolvedValue('{"version":"1.0"}'),
    };

    setSelectedFile(input, file);

    await input.onchange?.({ target: input } as unknown as Event);

    expect(file.text).toHaveBeenCalledTimes(1);
    expect(mockImportAllData).toHaveBeenCalledWith('{"version":"1.0"}');
    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Import complete",
        message: "Data imported successfully. The page will reload to reflect the changes.",
        buttonText: "Reload now",
      })
    );
    expect(mockReloadPage).toHaveBeenCalledTimes(1);
  });

  it("shows the import error message without reloading when the backup is invalid", async () => {
    mockShowConfirm.mockResolvedValueOnce({ confirmed: true });
    mockImportAllData.mockImplementation(() => {
      throw new Error("Broken backup");
    });

    const { input } = createFileInputSpy();

    renderMorePage();

    fireEvent.click(screen.getByRole("button", { name: /import data/i }));

    await waitFor(() => {
      expect(input.click).toHaveBeenCalledTimes(1);
    });

    const file = {
      text: vi.fn().mockResolvedValue('{"version":"1.0"}'),
    };

    setSelectedFile(input, file);

    await input.onchange?.({ target: input } as unknown as Event);

    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Import failed",
        message: "Broken backup",
        variant: "danger",
      })
    );
    expect(mockReloadPage).not.toHaveBeenCalled();
  });
});
