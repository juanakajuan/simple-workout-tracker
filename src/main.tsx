import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW();
  },
  onRegisteredSW(_swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) {
    if (!registration) return;

    const checkForUpdates = () => void registration.update();

    checkForUpdates();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    });
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
