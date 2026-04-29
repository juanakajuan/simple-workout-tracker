/**
 * Application release metadata and build tracking utilities.
 *
 * This module provides information about the current application build and
 * tracks whether the user has seen the latest version. It uses Vite's
 * define plugin to inject build-time constants.
 *
 * Features:
 * - Build metadata (version, build ID, git SHA, build timestamp)
 * - Update detection between sessions
 * - LocalStorage-based "seen" tracking
 *
 * @module appRelease
 */

/**
 * LocalStorage key for tracking the last seen build ID.
 */
const APP_BUILD_SEEN_KEY = "simple_workout_tracker_seen_build_id";
const LEGACY_APP_BUILD_SEEN_KEY = "zenith_seen_build_id";

/**
 * Application release information injected at build time by Vite.
 * These values are defined in vite.config.ts using the define plugin.
 */
export const APP_RELEASE: Readonly<{
  version: string;
  buildId: string;
  gitSha: string;
  builtAt: string;
}> = Object.freeze({
  /** Application version from package.json */
  version: __APP_VERSION__,
  /** Unique build identifier (timestamp-based) */
  buildId: __APP_BUILD_ID__,
  /** Git commit SHA at build time */
  gitSha: __APP_GIT_SHA__,
  /** ISO timestamp of when the build occurred */
  builtAt: __APP_BUILT_AT__,
});

/**
 * Formats an ISO timestamp into a human-readable localized string.
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Formatted date/time string, or "Unknown build time" if invalid
 *
 * @example
 * formatBuildTimestamp("2024-01-15T08:30:00Z") // Returns "Jan 15, 2024, 8:30:00 AM"
 */
export function formatBuildTimestamp(isoString: string): string {
  const buildDate = new Date(isoString);

  if (Number.isNaN(buildDate.getTime())) {
    return "Unknown build time";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(buildDate);
}

/**
 * Checks if the current build is different from the last seen build.
 * Used to detect when a new version has been deployed.
 *
 * @returns True if there's an unseen update, false otherwise or during SSR
 *
 * @example
 * if (hasUnseenAppUpdate()) {
 *   showUpdateNotification();
 * }
 */
export function hasUnseenAppUpdate(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const seenBuildId =
      window.localStorage.getItem(APP_BUILD_SEEN_KEY) ??
      window.localStorage.getItem(LEGACY_APP_BUILD_SEEN_KEY);
    return seenBuildId !== null && seenBuildId !== APP_RELEASE.buildId;
  } catch {
    return false;
  }
}

/**
 * Marks the current build as seen by the user.
 * Stores the current build ID in localStorage to track version awareness.
 */
export function markCurrentBuildAsSeen(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(APP_BUILD_SEEN_KEY, APP_RELEASE.buildId);
    window.localStorage.removeItem(LEGACY_APP_BUILD_SEEN_KEY);
  } catch {
    return;
  }
}
