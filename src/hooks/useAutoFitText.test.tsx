import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

import { useAutoFitText } from "./useAutoFitText";

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  constructor(private readonly callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }

  observe() {}

  unobserve() {}

  disconnect() {}

  trigger() {
    this.callback([] as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}

function createMockCanvasContext() {
  const context = {
    font: "",
    measureText(text: string) {
      const fontSizeMatch = /(\d+(?:\.\d+)?)px/.exec(context.font);
      const fontSize = fontSizeMatch ? Number.parseFloat(fontSizeMatch[1]) : 16;
      return { width: text.length * fontSize } as TextMetrics;
    },
  };

  return context as unknown as CanvasRenderingContext2D;
}

function AutoFitTextFixture({
  text,
  minFontSizePx,
}: {
  text: string | number;
  minFontSizePx?: number;
}) {
  const ref = useAutoFitText<HTMLHeadingElement>(
    text,
    minFontSizePx === undefined ? {} : { minFontSizePx }
  );

  return (
    <div data-testid="container">
      <h1 ref={ref}>{text}</h1>
    </div>
  );
}

describe("useAutoFitText", () => {
  beforeEach(() => {
    MockResizeObserver.instances = [];
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      fontSize: "20px",
      paddingLeft: "0px",
      paddingRight: "0px",
      fontStyle: "normal",
      fontWeight: "400",
      fontFamily: "Inter",
    } as CSSStyleDeclaration);

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
      createMockCanvasContext()
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shrinks the font until the text fits within the available width", () => {
    render(<AutoFitTextFixture text="1234567890" />);

    const container = screen.getByTestId("container");
    const heading = screen.getByRole("heading");
    let width = 150;

    Object.defineProperty(container, "clientWidth", {
      configurable: true,
      get: () => width,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(heading.style.fontSize).toBe("15px");
  });

  it("recalculates on resize and lets the text grow back to its base size", () => {
    render(<AutoFitTextFixture text="1234567890" />);

    const container = screen.getByTestId("container");
    const heading = screen.getByRole("heading");
    let width = 150;

    Object.defineProperty(container, "clientWidth", {
      configurable: true,
      get: () => width,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(heading.style.fontSize).toBe("15px");

    width = 220;

    act(() => {
      MockResizeObserver.instances[0]?.trigger();
    });

    expect(heading.style.fontSize).toBe("20px");
  });

  it("stops shrinking at the dynamic minimum font size for short text", () => {
    render(<AutoFitTextFixture text="1234567890" />);

    const container = screen.getByTestId("container");
    const heading = screen.getByRole("heading");

    Object.defineProperty(container, "clientWidth", {
      configurable: true,
      get: () => 10,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(heading.style.fontSize).toBe("13px");
  });

  it("respects an explicit minimum font size override", () => {
    render(<AutoFitTextFixture text="1234567890" minFontSizePx={16} />);

    const container = screen.getByTestId("container");
    const heading = screen.getByRole("heading");

    Object.defineProperty(container, "clientWidth", {
      configurable: true,
      get: () => 10,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(heading.style.fontSize).toBe("16px");
  });

  it("keeps the base font size when the text is empty after trimming", () => {
    render(<AutoFitTextFixture text="   " />);

    const container = screen.getByTestId("container");
    const heading = screen.getByRole("heading");

    Object.defineProperty(container, "clientWidth", {
      configurable: true,
      get: () => 10,
    });

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(heading.style.fontSize).toBe("20px");
  });
});
