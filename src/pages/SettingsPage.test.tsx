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

function setLS(key: string, value: unknown) {
  mockStorage.setItem(key, JSON.stringify(value));
}

function getLS<T>(key: string): T | null {
  const raw = mockStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

function renderSettingsPage() {
  return render(
    <MemoryRouter initialEntries={["/more/settings"]}>
      <Routes>
        <Route path="/more/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  );
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
    setLS(STORAGE_KEYS.SETTINGS, { autoMatchWeight: true } satisfies Settings);

    renderSettingsPage();

    const toggle = screen.getByRole("switch", { name: /auto-match weight/i });

    expect(toggle.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(getLS<Settings>(STORAGE_KEYS.SETTINGS)).toEqual({ autoMatchWeight: false });
  });

  it("defaults to disabled and persists the setting when toggled on", () => {
    renderSettingsPage();

    const toggle = screen.getByRole("switch", { name: /auto-match weight/i });

    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(getLS<Settings>(STORAGE_KEYS.SETTINGS)).toBeNull();

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(getLS<Settings>(STORAGE_KEYS.SETTINGS)).toEqual({ autoMatchWeight: true });
  });
});
