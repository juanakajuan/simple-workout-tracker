/**
 * Reusable tag/pill component for displaying labels and badges.
 *
 * The Tag component supports multiple variants (accent, default, muted) and
 * can optionally apply muscle group specific styling for workout-related tags.
 *
 * @example
 * ```tsx
 * // Basic muted tag
 * <Tag>3 SETS</Tag>
 *
 * // Muscle group tag with color
 * <Tag muscleGroup="chest">Chest</Tag>
 *
 * // Accent variant
 * <Tag variant="accent">New</Tag>
 * ```
 *
 * @module Tag
 */

import type { HTMLAttributes, ReactNode } from "react";

import type { MuscleGroup } from "../types";
import { getMuscleGroupClassName } from "../types";

/**
 * Visual style variants for the tag.
 * - "accent": Highlighted emphasis color
 * - "default": Standard styling
 * - "muted": Subdued, less prominent styling (default)
 */
type TagVariant = "accent" | "default" | "muted";

/**
 * Props for the Tag component.
 * Extends HTML span attributes for full flexibility.
 */
interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Content to display inside the tag */
  children: ReactNode;
  /** Visual style variant (default: "muted") */
  variant?: TagVariant;
  /** Optional muscle group for applying category-specific colors */
  muscleGroup?: MuscleGroup;
}

/**
 * Renders a pill-shaped tag/label with optional muscle group theming.
 *
 * When a muscleGroup is provided, the tag uses the corresponding color scheme
 * from the application's muscle group color palette.
 *
 * @param props - Component props including children, variant, and muscleGroup
 * @returns A styled span element containing the tag content
 *
 * @example
 * ```tsx
 * // Exercise count
 * <Tag>5 EXERCISES</Tag>
 *
 * // Muscle group with color coding
 * <Tag muscleGroup="back">Back</Tag>
 *
 * // Default exercise badge
 * <Tag variant="default">Default</Tag>
 *
 * // With custom class
 * <Tag className="custom-tag">Custom</Tag>
 * ```
 */
export function Tag({
  children,
  className,
  variant = "muted",
  muscleGroup,
  ...props
}: TagProps): React.ReactElement {
  const toneClassName = muscleGroup ? getMuscleGroupClassName(muscleGroup) : `tag-${variant}`;

  const tagClassName = ["tag", toneClassName, className].filter(Boolean).join(" ");

  return (
    <span className={tagClassName} {...props}>
      {children}
    </span>
  );
}
