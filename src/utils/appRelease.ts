const APP_BUILD_SEEN_KEY = "zenith_seen_build_id";

export const APP_RELEASE = Object.freeze({
  version: __APP_VERSION__,
  buildId: __APP_BUILD_ID__,
  gitSha: __APP_GIT_SHA__,
  builtAt: __APP_BUILT_AT__,
});

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

export function hasUnseenAppUpdate(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const seenBuildId = window.localStorage.getItem(APP_BUILD_SEEN_KEY);
    return seenBuildId !== null && seenBuildId !== APP_RELEASE.buildId;
  } catch {
    return false;
  }
}

export function markCurrentBuildAsSeen(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(APP_BUILD_SEEN_KEY, APP_RELEASE.buildId);
  } catch {
    return;
  }
}
