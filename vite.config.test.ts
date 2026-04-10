import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockExecSync, mockReadFileSync, mockReact, mockVitePWA } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockReact: vi.fn(() => ({ name: "react-plugin" })),
  mockVitePWA: vi.fn(() => ({ name: "pwa-plugin" })),
}));

vi.mock("node:child_process", () => ({
  default: { execSync: mockExecSync },
  execSync: mockExecSync,
}));

vi.mock("node:fs", () => ({
  default: { readFileSync: mockReadFileSync },
  readFileSync: mockReadFileSync,
}));

vi.mock("@vitejs/plugin-react", () => ({
  default: mockReact,
}));

vi.mock("vite-plugin-pwa", () => ({
  VitePWA: mockVitePWA,
}));

vi.mock("vite", () => ({
  defineConfig: <T>(config: T) => config,
}));

type ViteConfig = {
  define: Record<string, string>;
};

async function loadViteConfig() {
  vi.resetModules();
  return (await import("./vite.config")).default as ViteConfig;
}

describe("vite.config", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T12:34:56.789Z"));
    mockReadFileSync.mockReset().mockReturnValue('{"version":"0.1.0"}');
    mockExecSync.mockReset().mockReturnValue("abc123\n");
    mockReact.mockClear();
    mockVitePWA.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("builds the injected release constants from package, git sha, and timestamp", async () => {
    const config = await loadViteConfig();

    expect(config.define).toEqual(
      expect.objectContaining({
        __APP_VERSION__: JSON.stringify("0.1.0"),
        __APP_GIT_SHA__: JSON.stringify("abc123"),
        __APP_BUILT_AT__: JSON.stringify("2026-04-10T12:34:56.789Z"),
        __APP_BUILD_ID__: JSON.stringify("0.1.0-abc123-20260410123456"),
      })
    );
  });

  it("falls back to a dev git sha when git metadata is unavailable", async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("git unavailable");
    });

    const config = await loadViteConfig();

    expect(config.define.__APP_GIT_SHA__).toBe(JSON.stringify("dev"));
    expect(config.define.__APP_BUILD_ID__).toBe(JSON.stringify("0.1.0-dev-20260410123456"));
  });
});
