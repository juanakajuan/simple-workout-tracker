import { useState, useCallback, useMemo } from "react";

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "standard";
  onConfirm: () => void;
}

/**
 * Custom hook that provides a simple API for showing confirmation dialogs.
 * Returns a showConfirm function to trigger the dialog and a ConfirmDialog
 * component to render in your component tree.
 *
 * @returns Object containing showConfirm function and ConfirmDialog component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showConfirm, ConfirmDialog } = useConfirmDialog();
 *
 *   const handleDelete = () => {
 *     showConfirm({
 *       title: "Delete this item?",
 *       message: "This action cannot be undone.",
 *       onConfirm: () => performDelete()
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleDelete}>Delete</button>
 *       <ConfirmDialog />
 *     </>
 *   );
 * }
 * ```
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: "",
    onConfirm: () => {},
  });

  /**
   * Shows the confirmation dialog with the provided options.
   *
   * @param dialogOptions - Configuration for the confirmation dialog
   */
  const showConfirm = useCallback((dialogOptions: ConfirmDialogOptions) => {
    setOptions(dialogOptions);
    setIsOpen(true);
  }, []);

  /**
   * Closes the confirmation dialog.
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Memoized ConfirmDialog component props to prevent unnecessary re-renders.
   */
  const dialogProps = useMemo(
    () => ({
      isOpen,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      variant: options.variant,
      onConfirm: options.onConfirm,
      onCancel: handleClose,
    }),
    [isOpen, options, handleClose]
  );

  return {
    showConfirm,
    dialogProps,
  };
}
