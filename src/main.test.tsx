import { StrictMode, isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockApp, mockCreateRoot, mockRender } = vi.hoisted(() => {
  const app = vi.fn(() => null);
  const render = vi.fn();
  const createRoot = vi.fn(() => ({ render }));

  return {
    mockApp: app,
    mockCreateRoot: createRoot,
    mockRender: render,
  };
});

vi.mock("react-dom/client", () => ({
  createRoot: mockCreateRoot,
}));

vi.mock("./App", () => ({
  default: mockApp,
}));

describe("main", () => {
  beforeEach(() => {
    vi.resetModules();
    mockApp.mockReset().mockImplementation(() => null);
    mockCreateRoot.mockReset().mockImplementation(() => ({ render: mockRender }));
    mockRender.mockReset();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("bootstraps the app into the root element inside StrictMode", async () => {
    await import("./main");

    const rootElement = document.getElementById("root");

    expect(mockCreateRoot).toHaveBeenCalledWith(rootElement);
    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderedTree = mockRender.mock.calls[0]?.[0];
    expect(isValidElement(renderedTree)).toBe(true);
    expect(renderedTree.type).toBe(StrictMode);

    const appElement = renderedTree.props.children;
    expect(isValidElement(appElement)).toBe(true);
    expect(appElement.type).toBe(mockApp);
  });
});
