import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

import "./ConfirmDialog.css";

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  buttonText?: string;
  variant?: "danger" | "standard" | "warning";
  onClose: () => void;
}

export function AlertDialog({
  isOpen,
  title,
  message,
  buttonText = "Got it",
  variant = "standard",
  onClose,
}: AlertDialogProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal confirm-dialog alert-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby={message ? "alert-dialog-message" : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-content">
          <div className={`confirm-dialog-icon alert-dialog-icon ${variant}`}>
            <AlertCircle size={48} />
          </div>
          <h2 className="confirm-dialog-title" id="alert-dialog-title">
            {title}
          </h2>
          {message && (
            <p className="confirm-dialog-message" id="alert-dialog-message">
              {message}
            </p>
          )}
        </div>

        <div className="modal-footer alert-dialog-footer">
          <button
            type="button"
            className={`btn confirm-dialog-btn-confirm ${variant}`}
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
