import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import type { ReactNode } from "react";

import "./PageHeader.css";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
}

/**
 * Reusable page header component with back button and optional actions.
 * Used across all full-page views that were previously modals.
 */
export function PageHeader({ title, showBackButton = true, onBack, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="page-header">
      <div className="page-header-left">
        {showBackButton && (
          <button
            type="button"
            className="page-header-back"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
        )}
      </div>
      <h1 className="page-header-title">{title}</h1>
      <div className="page-header-right">{actions}</div>
    </header>
  );
}
