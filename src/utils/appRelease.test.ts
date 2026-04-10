import { afterEach, describe, expect, it, vi } from "vitest";

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

async function loadAppReleaseModule(buildId = "build-123") {
  vi.resetModules();
  const storage = new MockStorage();

  vi.stubGlobal("__APP_VERSION__", "0.1.0");
  vi.stubGlobal("__APP_BUILD_ID__", buildId);
  vi.stubGlobal("__APP_GIT_SHA__", "abc123");
  vi.stubGlobal("__APP_BUILT_AT__", "2026-04-10T12:34:56.000Z");
  vi.stubGlobal("localStorage", storage);
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });

  return import("./appRelease");
}

describe("appRelease", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("formats build timestamps and falls back for invalid values", async () => {
    const { formatBuildTimestamp } = await loadAppReleaseModule();
    const isoString = "2026-04-10T12:34:56.000Z";

    expect(formatBuildTimestamp(isoString)).toBe(
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(isoString))
    );
    expect(formatBuildTimestamp("not-a-date")).toBe("Unknown build time");
  });

  it("detects whether the current build has already been seen", async () => {
    const { hasUnseenAppUpdate } = await loadAppReleaseModule("build-456");

    expect(hasUnseenAppUpdate()).toBe(false);

    localStorage.setItem("zenith_seen_build_id", "build-456");
    expect(hasUnseenAppUpdate()).toBe(false);

    localStorage.setItem("zenith_seen_build_id", "build-123");
    expect(hasUnseenAppUpdate()).toBe(true);
  });

  it("persists the current build id when marked as seen", async () => {
    const { APP_RELEASE, markCurrentBuildAsSeen } = await loadAppReleaseModule("build-789");

    markCurrentBuildAsSeen();

    expect(localStorage.getItem("zenith_seen_build_id")).toBe(APP_RELEASE.buildId);
  });
});
