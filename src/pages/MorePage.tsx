import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, ChevronRight, Download, Upload } from "lucide-react";

import { PageHeader } from "../components/PageHeader";
import { useAppDialog } from "../hooks/appDialogContext";
import {
  APP_RELEASE,
  formatBuildTimestamp,
  hasUnseenAppUpdate,
  markCurrentBuildAsSeen,
} from "../utils/appRelease";
import { exportAllData, importAllData, downloadDataFile, hasActiveWorkout } from "../utils/storage";
import { reloadPage } from "../utils/browser";

import "./MorePage.css";

export function MorePage(): React.ReactElement {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAppDialog();
  const [hasDetectedRecentUpdate] = useState(() => hasUnseenAppUpdate());
  const buildTimestampLabel = formatBuildTimestamp(APP_RELEASE.builtAt);

  useEffect(() => {
    markCurrentBuildAsSeen();
  }, []);

  /**
   * Handles exporting all user data to a JSON file.
   * Generates a backup file and triggers browser download.
   */
  const handleExport = async (): Promise<void> => {
    try {
      const data = exportAllData();
      downloadDataFile(data);
    } catch (error) {
      console.error("Error exporting data:", error);
      await showAlert({
        title: "Export failed",
        message: "Failed to export data. Please try again.",
        variant: "danger",
      });
    }
  };

  /**
   * Handles importing user data from a JSON file.
   * Warns user if active workout exists, validates file, and replaces all data.
   */
  const handleImport = async (): Promise<void> => {
    const importWarnings = hasActiveWorkout()
      ? [
          {
            title: "Replace active workout?",
            message:
              "You have an active workout in progress. Importing data will replace it. Do you want to continue?",
            confirmText: "Continue",
          },
          {
            title: "Replace all data?",
            message:
              "This will replace all your current data with the imported data. This action cannot be undone.",
            confirmText: "Import",
          },
        ]
      : [
          {
            title: "Replace all data?",
            message:
              "This will replace all your current data with the imported data. This action cannot be undone.",
            confirmText: "Import",
          },
        ];

    for (const importWarning of importWarnings) {
      const { confirmed } = await showConfirm({
        ...importWarning,
        cancelText: "Cancel",
        variant: "danger",
      });

      if (!confirmed) {
        return;
      }
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";

    fileInput.onchange = async (event: Event): Promise<void> => {
      const selectedFile = (event.target as HTMLInputElement).files?.[0];
      if (!selectedFile) {
        return;
      }

      try {
        const fileContent = await selectedFile.text();
        importAllData(fileContent);

        await showAlert({
          title: "Import complete",
          message: "Data imported successfully. The page will reload to reflect the changes.",
          buttonText: "Reload now",
        });
        reloadPage();
      } catch (error) {
        console.error("Error importing data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to import data. Please try again.";
        await showAlert({
          title: "Import failed",
          message: errorMessage,
          variant: "danger",
        });
      }
    };

    fileInput.click();
  };

  return (
    <div className="page">
      <PageHeader title="More" showBackButton={false} />

      <div className="more-content">
        <section className="more-section">
          <div className="more-version-card">
            <div className="more-version-header">
              <p className="more-version-label">App Version</p>
              {hasDetectedRecentUpdate ? <span className="more-version-badge">Updated</span> : null}
            </div>

            <p className="more-version-value">v{APP_RELEASE.version}</p>
            <p className="more-version-meta">Build {APP_RELEASE.buildId}</p>
            <p className="more-version-status">
              {hasDetectedRecentUpdate
                ? `This device picked up a newer build at ${buildTimestampLabel} since your last visit here.`
                : `Built ${buildTimestampLabel}. This card will flag when a newer build is installed on this device.`}
            </p>
          </div>
        </section>

        <section className="more-section">
          <button className="more-menu-item" onClick={() => navigate("/more/settings")}>
            <div className="more-menu-item-icon">
              <Settings size={20} />
            </div>
            <span className="more-menu-item-label">Settings</span>
            <ChevronRight size={20} className="more-menu-item-chevron" />
          </button>
        </section>

        <section className="more-section">
          <button className="more-menu-item" onClick={() => void handleExport()}>
            <div className="more-menu-item-icon">
              <Download size={20} />
            </div>
            <span className="more-menu-item-label">Export Data</span>
            <ChevronRight size={20} className="more-menu-item-chevron" />
          </button>

          <button className="more-menu-item" onClick={() => void handleImport()}>
            <div className="more-menu-item-icon">
              <Upload size={20} />
            </div>
            <span className="more-menu-item-label">Import Data</span>
            <ChevronRight size={20} className="more-menu-item-chevron" />
          </button>
        </section>
      </div>
    </div>
  );
}
