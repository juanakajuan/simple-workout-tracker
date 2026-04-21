import { afterEach, describe, expect, it, vi } from "vitest";

const seenBuildIdentifierStorageKey = "zenith_seen_build_id";

/** In-memory `Storage` implementation for app release tests. */
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

/** Loads the module with fresh globals for each test scenario. */
async function importAppReleaseModule(
  buildId: string = "build-123"
): Promise<typeof import("./appRelease")> {
  vi.resetModules();
  const mockStorage = new MockStorage();

  vi.stubGlobal("__APP_VERSION__", "0.1.0");
  vi.stubGlobal("__APP_BUILD_ID__", buildId);
  vi.stubGlobal("__APP_GIT_SHA__", "abc123");
  vi.stubGlobal("__APP_BUILT_AT__", "2026-04-10T12:34:56.000Z");
  vi.stubGlobal("localStorage", mockStorage);
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: mockStorage,
  });

  return import("./appRelease");
}

describe("appRelease", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("formats build timestamps and falls back for invalid values", async () => {
    const { formatBuildTimestamp } = await importAppReleaseModule();
    const buildTimestampIsoString = "2026-04-10T12:34:56.000Z";

    expect(formatBuildTimestamp(buildTimestampIsoString)).toBe(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(buildTimestampIsoString))
    );
    expect(formatBuildTimestamp("not-a-date")).toBe("Unknown build time");
  });

  it("detects whether the current build has already been seen", async () => {
    const { hasUnseenAppUpdate } = await importAppReleaseModule("build-456");

    expect(hasUnseenAppUpdate()).toBe(false);

    localStorage.setItem(seenBuildIdentifierStorageKey, "build-456");
    expect(hasUnseenAppUpdate()).toBe(false);

    localStorage.setItem(seenBuildIdentifierStorageKey, "build-123");
    expect(hasUnseenAppUpdate()).toBe(true);
  });

  it("persists the current build id when marked as seen", async () => {
    const { APP_RELEASE, markCurrentBuildAsSeen } = await importAppReleaseModule("build-789");

    markCurrentBuildAsSeen();

    expect(localStorage.getItem(seenBuildIdentifierStorageKey)).toBe(APP_RELEASE.buildId);
  });
});
