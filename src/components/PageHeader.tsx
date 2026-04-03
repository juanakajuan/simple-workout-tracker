import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import type { ReactNode } from "react";

import { useAutoFitText } from "../hooks/useAutoFitText";

import "./PageHeader.css";

interface PageHeaderProps {
  title: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  leftSlot?: ReactNode;
  actions?: ReactNode;
}

/**
 * Reusable page header component with back button and optional actions.
 * Used across all full-page views that were previously modals.
 */
export function PageHeader({
  title,
  showBackButton = true,
  onBack,
  leftSlot,
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const titleRef = useAutoFitText<HTMLHeadingElement>(
    typeof title === "string" || typeof title === "number" ? title : ""
  );

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="page-header">
      <div className="page-header-side page-header-left">
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
        {leftSlot}
      </div>
      <div className="page-header-center">
        {typeof title === "string" || typeof title === "number" ? (
          <h1 ref={titleRef} className="page-header-title">
            {title}
          </h1>
        ) : (
          title
        )}
      </div>
      <div className="page-header-side page-header-right">{actions}</div>
    </header>
  );
}
