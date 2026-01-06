import "./ToggleSwitch.css";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, label, disabled = false }: ToggleSwitchProps) {
  /**
   * Handles toggling the switch state. Does nothing if the switch is disabled.
   */
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  /**
   * Handles keyboard interactions for the toggle switch. Toggles on Enter or Space key.
   *
   * @param event - The keyboard event
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="toggle-switch-wrapper">
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`toggle-switch ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        type="button"
      >
        <span className="toggle-switch-track">
          <span className="toggle-switch-thumb" />
        </span>
      </button>
    </div>
  );
}
