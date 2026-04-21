import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

import { useLocalStorage } from "./useLocalStorage";

/** In-memory `Storage` implementation for deterministic hook tests. */
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

const mockStorage = new MockStorage();

/** Dispatches a `storage` event with the provided key/value pair. */
function dispatchStorageEvent(key: string, newValue: string | null): void {
  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue,
      })
    );
  });
}

describe("useLocalStorage", () => {
  beforeEach(() => {
    mockStorage.clear();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("falls back to the initial value when stored data cannot be parsed or deserialized", () => {
    mockStorage.setItem("broken-json", "{");

    const { result: resultWithMalformedStorage, unmount } = renderHook(() =>
      useLocalStorage("broken-json", 12)
    );

    expect(resultWithMalformedStorage.current[0]).toBe(12);
    expect(console.error).toHaveBeenCalledWith(
      'Error reading localStorage key "broken-json":',
      expect.anything()
    );

    unmount();
    vi.clearAllMocks();

    mockStorage.setItem("bad-shape", JSON.stringify({ count: "oops" }));

    const { result: resultWithInvalidDeserializedValue } = renderHook(() =>
      useLocalStorage("bad-shape", 7, {
        deserialize: (value) => {
          if (typeof (value as { count?: unknown }).count !== "number") {
            throw new Error("Invalid counter");
          }

          return (value as { count: number }).count;
        },
      })
    );

    expect(resultWithInvalidDeserializedValue.current[0]).toBe(7);
    expect(console.error).toHaveBeenCalledWith(
      'Error reading localStorage key "bad-shape":',
      expect.any(Error)
    );
  });

  it("supports functional updates and persists each new value", () => {
    const { result } = renderHook(() => useLocalStorage("counter", 1));

    act(() => {
      result.current[1]((currentValue) => currentValue + 2);
    });

    expect(result.current[0]).toBe(3);
    expect(JSON.parse(mockStorage.getItem("counter") ?? "null")).toBe(3);

    act(() => {
      result.current[1]((currentValue) => currentValue * 2);
    });

    expect(result.current[0]).toBe(6);
    expect(JSON.parse(mockStorage.getItem("counter") ?? "null")).toBe(6);
  });

  it("syncs same-key storage events across tabs and resets on removal", () => {
    const initialSettings = { autoMatchWeight: false };
    const { result } = renderHook(() => useLocalStorage("settings", initialSettings));

    dispatchStorageEvent("other-key", JSON.stringify({ autoMatchWeight: true }));

    expect(result.current[0]).toEqual(initialSettings);

    dispatchStorageEvent("settings", JSON.stringify({ autoMatchWeight: true }));

    expect(result.current[0]).toEqual({ autoMatchWeight: true });

    dispatchStorageEvent("settings", null);

    expect(result.current[0]).toEqual(initialSettings);
  });
});
