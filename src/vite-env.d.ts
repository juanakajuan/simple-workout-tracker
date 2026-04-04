/**
 * Type definitions for Vite's client-side environment.
 *
 * This file declares global constants injected by Vite during the build process.
 * These constants are defined in vite.config.ts using the define plugin and provide
 * build-time metadata about the application version and build information.
 *
 * @module vite-env
 */

/// <reference types="vite/client" />

/**
 * Application version from package.json.
 * Updated with each release.
 */
declare const __APP_VERSION__: string;

/**
 * Unique build identifier based on build timestamp.
 * Used to detect new deployments and trigger update notifications.
 */
declare const __APP_BUILD_ID__: string;

/**
 * Git commit SHA at the time of build.
 * Useful for tracking which code revision is deployed.
 */
declare const __APP_GIT_SHA__: string;

/**
 * ISO 8601 timestamp of when the build occurred.
 * Displayed in the More page to show when the app was built.
 */
declare const __APP_BUILT_AT__: string;
