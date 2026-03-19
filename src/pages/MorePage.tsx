import { useNavigate } from "react-router-dom";
import { Settings, ChevronRight, Download, Upload } from "lucide-react";

import { useAppDialog } from "../hooks/useAppDialog";
import { exportAllData, importAllData, downloadDataFile, hasActiveWorkout } from "../utils/storage";

import "./MorePage.css";

export function MorePage() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAppDialog();

  /**
   * Handles exporting all user data to a JSON file.
   * Generates a backup file and triggers browser download.
   */
  const handleExport = async () => {
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
  const handleImport = async () => {
    if (hasActiveWorkout()) {
      const { confirmed } = await showConfirm({
        title: "Replace active workout?",
        message:
          "You have an active workout in progress. Importing data will replace it. Do you want to continue?",
        confirmText: "Continue",
        cancelText: "Cancel",
        variant: "danger",
      });
      if (!confirmed) {
        return;
      }
    }

    const { confirmed } = await showConfirm({
      title: "Replace all data?",
      message:
        "This will replace all your current data with the imported data. This action cannot be undone.",
      confirmText: "Import",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) {
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      try {
        const fileContent = await file.text();
        importAllData(fileContent);

        await showAlert({
          title: "Import complete",
          message: "Data imported successfully. The page will reload to reflect the changes.",
          buttonText: "Reload now",
        });
        window.location.reload();
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

    input.click();
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">More</h1>
      </header>

      <div className="more-content">
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
