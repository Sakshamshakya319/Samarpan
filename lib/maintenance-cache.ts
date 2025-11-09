// Simple file-based cache for maintenance settings
// This avoids using Node.js modules in Edge Runtime

let maintenanceSettings: any = null;
let lastFetchTime = 0;
// Keep a short timestamp for potential future revalidation, but do not
// reset to defaults on cache expiry since we have no backing store.
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Default settings
const DEFAULT_SETTINGS = {
  enabled: false,
  message: "The website is currently under maintenance. We will be back shortly.",
  allowedIps: [],
  secretKey: "",
  enabledAt: null
};

export function getMaintenanceSettings() {
  const now = Date.now();
  // If we have settings in memory, return them regardless of cache duration.
  // The previous behavior reset to DEFAULT_SETTINGS after 30s, which caused
  // maintenance mode to switch off unexpectedly. Without a DB, we should
  // keep the last updated values.
  if (maintenanceSettings) {
    return maintenanceSettings;
  }

  // Initialize with defaults if nothing has been set yet
  maintenanceSettings = DEFAULT_SETTINGS;
  lastFetchTime = now;
  return maintenanceSettings;
}

export function updateMaintenanceSettings(settings: any) {
  maintenanceSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    enabledAt: settings.enabled ? new Date().toISOString() : null
  };
  lastFetchTime = Date.now();
  return maintenanceSettings;
}