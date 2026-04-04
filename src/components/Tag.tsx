import type { HTMLAttributes, ReactNode } from "react";

import type { MuscleGroup } from "../types";
import { getMuscleGroupClassName } from "../types";

type TagVariant = "accent" | "default" | "muted";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: TagVariant;
  muscleGroup?: MuscleGroup;
}

export function Tag({ children, className, variant = "muted", muscleGroup, ...props }: TagProps) {
  const toneClassName = muscleGroup ? getMuscleGroupClassName(muscleGroup) : `tag-${variant}`;

  const tagClassName = ["tag", toneClassName, className].filter(Boolean).join(" ");

  return (
    <span className={tagClassName} {...props}>
      {children}
    </span>
  );
}
