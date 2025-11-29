export const DEFAULT_VALUES = {
  EMOJI: "📝",
};

export const TIMING = {
  DEBOUNCE_DELAY: 1000,
  DEBOUNCE_TITLE_MS: 1000,
  DEBOUNCE_CONTENT_MS: 1000,
  TOAST_DURATION: 3000,
  SYNC_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
  FOCUS_DELAY_MS: 100, // Delay before focusing input elements
};

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

export const STORAGE_KEYS = {
  PREFIX: "camnova-",
  SESSION_SYNCED: "camnova-session-synced",
  LAST_SYNC: "camnova-last-sync",
  PROJECTS: "camnova-projects-cache",
  LAST_PROJECT: "camnova-last-project",
  project: (id: string) => `camnova-project-${id}`,
};

export const API_HEADERS = {
  CLIENT_KEY: "x-camnova-client",
  CLIENT_VALUE: "camnova-web",
};
