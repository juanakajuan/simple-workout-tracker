import type { Settings } from "../types";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../utils/storage";

import { PageHeader } from "../components/PageHeader";
import { ToggleSwitch } from "../components/ToggleSwitch";

import "./SettingsPage.css";

export function SettingsPage() {
  const [settings, setSettings] = useLocalStorage<Settings>(STORAGE_KEYS.SETTINGS, {
    autoMatchWeight: false,
  });

  /**
   * Updates the auto-match weight setting in localStorage.
   *
   * @param checked - Whether auto-match weight should be enabled
   */
  const handleAutoMatchWeightToggle = (checked: boolean) => {
    setSettings({ ...settings, autoMatchWeight: checked });
  };

  return (
    <div className="page settings-page">
      <PageHeader title="Settings" />

      <div className="settings-content">
        <section className="settings-section">
          <h2 className="settings-section-title">Workout Settings</h2>

          <div className="settings-item">
            <div className="settings-item-content">
              <h3 className="settings-item-title">Auto-Match Weight</h3>
              <p className="settings-item-description">
                Apply weight changes to all sets in an exercise
              </p>
            </div>
            <ToggleSwitch
              checked={settings.autoMatchWeight}
              onChange={handleAutoMatchWeightToggle}
              label="Auto-match weight"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
