import { useEffect, useRef } from "react";

interface AutoFitTextOptions {
  minFontSizePx?: number;
}

function measureTextWidth(text: string, fontSizePx: number, style: CSSStyleDeclaration) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return 0;

  context.font = `${style.fontStyle} ${style.fontWeight} ${fontSizePx}px ${style.fontFamily}`;
  return context.measureText(text).width;
}

export function useAutoFitText<T extends HTMLElement>(
  text: string | number,
  options: AutoFitTextOptions = {}
) {
  const elementRef = useRef<T>(null);
  const baseFontSizeRef = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const fitText = () => {
      const style = window.getComputedStyle(element);

      if (baseFontSizeRef.current === null) {
        baseFontSizeRef.current = Number.parseFloat(style.fontSize);
      }

      const baseFontSize = baseFontSizeRef.current;
      const minFontSize = options.minFontSizePx ?? Math.max(12, baseFontSize * 0.72);
      const availableWidth =
        element.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);

      if (availableWidth <= 0) return;

      // Reset before measuring so the title can grow back when space becomes available.
      element.style.fontSize = `${baseFontSize}px`;

      const nextText = String(text).trim();
      if (!nextText) return;

      let fontSize = baseFontSize;
      while (
        fontSize > minFontSize &&
        measureTextWidth(nextText, fontSize, style) > availableWidth
      ) {
        fontSize -= 0.5;
      }

      element.style.fontSize = `${Math.max(fontSize, minFontSize)}px`;
    };

    fitText();

    const container = element.parentElement ?? element;
    const resizeObserver = new ResizeObserver(fitText);
    resizeObserver.observe(container);
    window.addEventListener("resize", fitText);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", fitText);
    };
  }, [options.minFontSizePx, text]);

  return elementRef;
}
