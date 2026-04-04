import { createContext, useContext } from "react";

import type { AppDialogContextValue } from "./useAppDialog";

export const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function useAppDialog() {
  const context = useContext(AppDialogContext);

  if (!context) {
    throw new Error("useAppDialog must be used within an AppDialogProvider");
  }

  return context;
}
