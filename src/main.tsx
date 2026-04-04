/**
 * Application entry point for Zenith.
 *
 * This module initializes the React application by:
 * - Setting up StrictMode for development checks
 * - Creating the root DOM container
 * - Rendering the App component
 *
 * @module main
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * Renders the React application into the root DOM element.
 * Uses StrictMode to help identify potential problems in development.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
