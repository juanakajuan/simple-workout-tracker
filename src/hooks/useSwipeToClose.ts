import { useRef, useState, useEffect, useCallback, useMemo } from "react";

/**
 * Configuration constants for swipe gesture behavior.
 */
const SWIPE_THRESHOLD = 120; // px - minimum distance to trigger close
const VELOCITY_THRESHOLD = 0.5; // px/ms - minimum velocity to trigger close
const DIRECTION_LOCK_THRESHOLD = 10; // px - movement before determining swipe direction
const SNAP_BACK_DURATION = 250; // ms - animation duration when returning to position
const RESISTANCE_FACTOR = 0.3; // Resistance multiplier when swiping past threshold

/**
 * Custom hook that provides horizontal swipe-to-close functionality for modals.
 * Implements native-feeling swipe gestures with visual feedback and smooth animations.
 *
 * @param onClose - Callback function to execute when swipe-to-close is triggered
 * @returns Object containing ref and style to apply to the modal element
 *
 * @example
 * ```tsx
 * function MyModal({ onClose }) {
 *   const swipeHandlers = useSwipeToClose(onClose);
 *   return (
 *     <div className="modal-overlay">
 *       <div ref={swipeHandlers.ref} style={swipeHandlers.style} className="modal">
 *         Modal content
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSwipeToClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  const touchState = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isHorizontalSwipe: false,
    isSwipeEnabled: true,
    currentX: 0,
  });

  /**
   * Check if the touch target is an interactive element where swipe should be disabled.
   */
  const isInteractiveElement = useCallback((target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;

    const interactiveTags = ["input", "textarea", "select", "button"];

    // Check if target or any parent is interactive
    let element: HTMLElement | null = target;
    while (element) {
      if (interactiveTags.includes(element.tagName.toLowerCase())) {
        return true;
      }
      if (element.contentEditable === "true") {
        return true;
      }
      element = element.parentElement;
    }

    return false;
  }, []);

  /**
   * Handle touch start - initialize swipe tracking.
   */
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];

      if (isInteractiveElement(e.target)) {
        touchState.current.isSwipeEnabled = false;
        return;
      }

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isHorizontalSwipe: false,
        isSwipeEnabled: true,
        currentX: touch.clientX,
      };
    },
    [isInteractiveElement]
  );

  /**
   * Handle touch move - track swipe progress and apply visual feedback.
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchState.current.isSwipeEnabled) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;

      touchState.current.currentX = touch.clientX;

      // Determine swipe direction after minimum movement (direction lock)
      if (!touchState.current.isHorizontalSwipe && !isDragging) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > DIRECTION_LOCK_THRESHOLD || absY > DIRECTION_LOCK_THRESHOLD) {
          // Lock to horizontal swipe if horizontal movement dominates
          if (absX > absY) {
            touchState.current.isHorizontalSwipe = true;
            setIsDragging(true);
          } else {
            // Vertical scroll detected, disable swipe for this gesture
            touchState.current.isSwipeEnabled = false;
            return;
          }
        }
      }

      if (touchState.current.isHorizontalSwipe) {
        // Only prevent default if the event is cancelable
        // This avoids browser warnings about interrupting ongoing scrolls
        if (e.cancelable) {
          e.preventDefault();
        }

        // Only allow right-swipe (positive deltaX)
        let offset = Math.max(0, deltaX);

        // Apply resistance curve when swiping past threshold
        if (offset > SWIPE_THRESHOLD) {
          const excess = offset - SWIPE_THRESHOLD;
          offset = SWIPE_THRESHOLD + excess * RESISTANCE_FACTOR;
        }

        setDragOffset(offset);

        // Calculate overlay opacity (fade out as swipe progresses)
        const progress = Math.min(offset / SWIPE_THRESHOLD, 1);
        const opacity = 1 - progress * 0.5; // Fade to 50% opacity at threshold
        setOverlayOpacity(opacity);
      }
    },
    [isDragging]
  );

  /**
   * Handle touch end - determine if swipe should trigger close or snap back.
   */
  const handleTouchEnd = useCallback(() => {
    if (!touchState.current.isSwipeEnabled || !touchState.current.isHorizontalSwipe) {
      setIsDragging(false);
      setDragOffset(0);
      setOverlayOpacity(1);
      return;
    }

    const swipeDuration = Date.now() - touchState.current.startTime;
    const swipeDistance = dragOffset;
    const velocity = swipeDuration > 0 ? swipeDistance / swipeDuration : 0;

    const shouldClose = swipeDistance > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (shouldClose) {
      onClose();
    } else {
      setIsDragging(false);
      setDragOffset(0);
      setOverlayOpacity(1);
    }
  }, [dragOffset, onClose]);

  /**
   * Attach touch event listeners to modal element.
   */
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  /**
   * Calculate dynamic styles based on current swipe state.
   */
  const style: React.CSSProperties = useMemo(
    () => ({
      transform: `translateX(${dragOffset}px)`,
      transition: isDragging ? "none" : `transform ${SNAP_BACK_DURATION}ms ease-out`,
      willChange: isDragging ? "transform" : "auto",
    }),
    [dragOffset, isDragging]
  );

  // Return ref and style separately to avoid ESLint false positive
  // The ref is stable and won't change, so it's safe to return directly
  return {
    ref,
    style,
    overlayOpacity,
  };
}
