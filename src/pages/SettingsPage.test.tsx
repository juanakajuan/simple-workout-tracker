import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { Settings } from "../types";
import { STORAGE_KEYS } from "../utils/storage";
import { SettingsPage } from "./SettingsPage";

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const mockStorage = new MockStorage();

/** Stores a JSON-serialized value in the mocked local storage. */
function setStoredJsonValue(key: string, value: unknown): void {
  mockStorage.setItem(key, JSON.stringify(value));
}

/** Reads and parses a JSON-serialized value from the mocked local storage. */
function getStoredJsonValue<Value>(key: string): Value | null {
  const raw = mockStorage.getItem(key);
  return raw ? (JSON.parse(raw) as Value) : null;
}

/** Renders the settings page under the route path used in these tests. */
function renderSettingsPage(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={["/more/settings"]}>
      <Routes>
        <Route path="/more/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

/** Returns the auto-match weight toggle rendered on the page. */
function getAutoMatchWeightToggle(): HTMLElement {
  return screen.getByRole("switch", { name: /auto-match weight/i });
}

describe("SettingsPage", () => {
  beforeEach(() => {
    mockStorage.clear();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    window.ResizeObserver = MockResizeObserver;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads the persisted setting and writes the updated value when toggled off", () => {
    setStoredJsonValue(STORAGE_KEYS.SETTINGS, { autoMatchWeight: true } satisfies Settings);

    renderSettingsPage();

    const autoMatchWeightToggle = getAutoMatchWeightToggle();

    expect(autoMatchWeightToggle.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(autoMatchWeightToggle);

    expect(autoMatchWeightToggle.getAttribute("aria-checked")).toBe("false");
    expect(getStoredJsonValue<Settings>(STORAGE_KEYS.SETTINGS)).toEqual({ autoMatchWeight: false });
  });

  it("defaults to disabled and persists the setting when toggled on", () => {
    renderSettingsPage();

    const autoMatchWeightToggle = getAutoMatchWeightToggle();

    expect(autoMatchWeightToggle.getAttribute("aria-checked")).toBe("false");
    expect(getStoredJsonValue<Settings>(STORAGE_KEYS.SETTINGS)).toBeNull();

    fireEvent.click(autoMatchWeightToggle);

    expect(autoMatchWeightToggle.getAttribute("aria-checked")).toBe("true");
    expect(getStoredJsonValue<Settings>(STORAGE_KEYS.SETTINGS)).toEqual({ autoMatchWeight: true });
  });
});
