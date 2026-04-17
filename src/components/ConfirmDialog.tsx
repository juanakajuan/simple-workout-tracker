import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "standard";
  onConfirm: (checkboxChecked?: boolean) => void;
  onCancel: () => void;
  checkboxLabel?: string;
  checkboxDefaultChecked?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  checkboxLabel,
  checkboxDefaultChecked = false,
}: ConfirmDialogProps): React.ReactElement | null {
  const checkboxInputReference = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when dialog is open
    document.body.style.overflow = "hidden";

    // Handle escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-content">
          <div className="confirm-dialog-icon">
            <AlertCircle size={48} />
          </div>
          <h2 className="confirm-dialog-title">{title}</h2>
          {message && <p className="confirm-dialog-message">{message}</p>}
        </div>

        {checkboxLabel && (
          <div className="confirm-dialog-checkbox-container">
            <label className="confirm-dialog-checkbox-label">
              <input
                ref={checkboxInputReference}
                type="checkbox"
                defaultChecked={checkboxDefaultChecked}
              />
              <span>{checkboxLabel}</span>
            </label>
          </div>
        )}

        <div className="modal-footer confirm-dialog-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn confirm-dialog-btn-confirm ${variant}`}
            onClick={() => {
              const checkboxValue = checkboxLabel
                ? (checkboxInputReference.current?.checked ?? checkboxDefaultChecked)
                : undefined;

              onConfirm(checkboxValue);
              onCancel();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
