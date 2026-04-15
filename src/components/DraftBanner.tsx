import { FileEdit, X } from "lucide-react";

import "./DraftBanner.css";

interface DraftBannerProps {
  onContinue: () => void;
  onDismiss: () => void;
}

export function DraftBanner({ onContinue, onDismiss }: DraftBannerProps): React.ReactElement {
  /**
   * Handles clicking the dismiss button. Stops event propagation to prevent
   * triggering the banner's onClick and calls the onDismiss callback.
   *
   * @param event - The mouse event
   */
  const handleDismissClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDismiss();
  };

  return (
    <div className="draft-banner" onClick={onContinue}>
      <div className="draft-banner-icon">
        <FileEdit size={20} />
      </div>
      <div className="draft-banner-content">
        <div className="draft-banner-text">You have an unsaved template draft</div>
        <div className="draft-banner-hint">Tap to continue editing</div>
      </div>
      <button
        className="draft-banner-dismiss"
        onClick={handleDismissClick}
        aria-label="Dismiss draft"
      >
        <X size={18} />
      </button>
    </div>
  );
}
