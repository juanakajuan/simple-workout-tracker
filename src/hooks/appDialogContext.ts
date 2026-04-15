/**
 * React Context and hook for the application dialog system.
 *
 * This module provides the context infrastructure for showing alert and confirm
 * dialogs throughout the application. The actual dialog UI is managed by
 * AppDialogProvider in useAppDialog.tsx.
 *
 * @example
 * ```tsx
 * // In a component that needs dialogs:
 * const { showAlert, showConfirm } = useAppDialog();
 *
 * // Show an alert
 * await showAlert({ title: "Success!", message: "Item saved." });
 *
 * // Show a confirmation
 * const { confirmed } = await showConfirm({
 *   title: "Delete?",
 *   message: "This cannot be undone."
 * });
 * ```
 *
 * @module appDialogContext
 */

import { createContext, useContext, type Context } from "react";

import type { AppDialogContextValue } from "./useAppDialog";

/**
 * React Context that holds the dialog control functions.
 * Should not be used directly - use useAppDialog() hook instead.
 */
export const AppDialogContext: Context<AppDialogContextValue | null> =
  createContext<AppDialogContextValue | null>(null);

/**
 * Custom hook to access the application dialog system.
 *
 * Must be used within an AppDialogProvider (typically at the App root level).
 * Provides showAlert and showConfirm functions for displaying modal dialogs.
 *
 * @returns Object containing showAlert and showConfirm functions
 * @throws Error if used outside of AppDialogProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showConfirm } = useAppDialog();
 *
 *   const handleDelete = async () => {
 *     const { confirmed } = await showConfirm({
 *       title: "Delete exercise?",
 *       message: "This action cannot be undone.",
 *       variant: "danger"
 *     });
 *
 *     if (confirmed) {
 *       // Perform deletion
 *     }
 *   };
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
 */
export function useAppDialog(): AppDialogContextValue {
  const context = useContext(AppDialogContext);

  if (!context) {
    throw new Error("useAppDialog must be used within an AppDialogProvider");
  }

  return context;
}
