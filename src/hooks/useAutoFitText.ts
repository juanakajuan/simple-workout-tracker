/**
 * Custom hook for automatically adjusting font size to fit container width.
 *
 * This hook measures text width using canvas and dynamically adjusts the font size
 * to prevent overflow. It supports minimum font size constraints and responds to
 * container resize events.
 *
 * Features:
 * - Dynamic font size reduction based on available space
 * - Canvas-based text measurement for accuracy
 * - ResizeObserver for responsive adjustments
 * - Configurable minimum font size
 * - Text length-aware minimum scaling ratios
 *
 * @example
 * ```tsx
 * const titleRef = useAutoFitText<HTMLHeadingElement>(pageTitle);
 * return <h1 ref={titleRef}>{pageTitle}</h1>;
 * ```
 *
 * @module useAutoFitText
 */

import { useEffect, useRef, type RefObject } from "react";

/**
 * Configuration options for the auto-fit text behavior.
 */
interface AutoFitTextOptions {
  /**
   * Minimum font size in pixels. If not provided, calculated dynamically
   * based on base font size and text length.
   */
  minFontSizePx?: number;
}

/**
 * Measures text width using canvas for accurate font rendering.
 *
 * @param text The text to measure
 * @param fontSizePx The font size in pixels
 * @param style The computed CSS style of the element
 * @returns The measured width in pixels, or 0 if canvas context is unavailable
 */
function measureTextWidth(text: string, fontSizePx: number, style: CSSStyleDeclaration) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) return 0;

  context.font = `${style.fontStyle} ${style.fontWeight} ${fontSizePx}px ${style.fontFamily}`;
  return context.measureText(text).width;
}

/**
 * React hook that automatically adjusts an element's font size to fit its container.
 *
 * The hook measures the text using canvas and progressively reduces font size
 * until the text fits within the available width or reaches the minimum size.
 *
 * @template T The type of HTML element to apply auto-fit to (must extend HTMLElement)
 * @param text The text content to fit (will be converted to string)
 * @param options Optional configuration for minimum font size
 * @returns A ref to attach to the target element
 *
 * @example
 * ```tsx
 * // Basic usage with heading
 * const headerRef = useAutoFitText<HTMLHeadingElement>("Long Page Title");
 * <h1 ref={headerRef}>Long Page Title</h1>
 *
 * // With custom minimum font size
 * const labelRef = useAutoFitText<HTMLSpanElement>(labelText, { minFontSizePx: 12 });
 * <span ref={labelRef}>{labelText}</span>
 * ```
 */
export function useAutoFitText<T extends HTMLElement>(
  text: string | number,
  options: AutoFitTextOptions = {}
): RefObject<T | null> {
  const elementRef = useRef<T>(null);
  const baseFontSizeRef = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    /**
     * Calculates and applies the optimal font size for the text to fit.
     * Considers parent element width, padding, and text length.
     */
    const fitText = () => {
      const style = window.getComputedStyle(element);

      // Store the original base font size on first run
      if (baseFontSizeRef.current === null) {
        baseFontSizeRef.current = Number.parseFloat(style.fontSize);
      }

      const baseFontSize = baseFontSizeRef.current;

      // Dynamic minimum font size based on text length
      // Longer text gets a much lower minimum to fit better
      const textLength = String(text).length;
      let minSizeRatio = 0.65; // default ratio

      if (textLength > 30) {
        minSizeRatio = 0.45; // Very long text can shrink significantly
      } else if (textLength > 20) {
        minSizeRatio = 0.55; // Medium-long text can shrink more
      }

      const minFontSize = options.minFontSizePx ?? Math.max(11, baseFontSize * minSizeRatio);

      // Use parent element's width for more accurate measurement
      // This accounts for the actual available space in the layout
      const parentElement = element.parentElement;
      const availableWidth = parentElement
        ? parentElement.clientWidth -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight)
        : element.clientWidth -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight);

      if (availableWidth <= 0) return;

      // Reset before measuring so the title can grow back when space becomes available.
      element.style.fontSize = `${baseFontSize}px`;

      const nextText = String(text).trim();
      if (!nextText) return;

      // Gradually reduce font size until text fits
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

    // Set up resize observers
    const container = element.parentElement ?? element;
    const resizeObserver = new ResizeObserver(fitText);
    resizeObserver.observe(container);
    window.addEventListener("resize", fitText);

    // Cleanup observers on unmount
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", fitText);
    };
  }, [options.minFontSizePx, text]);

  return elementRef;
}
