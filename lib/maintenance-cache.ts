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
  message: "We are currently performing scheduled maintenance to improve your experience. Please check back shortly.",
  allowedIps: [],
  secretKey: "",
  priority: "medium",
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
  const previousSettings = maintenanceSettings || DEFAULT_SETTINGS;
  
  maintenanceSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    // Only update enabledAt if maintenance is being enabled for the first time
    // or if it was previously disabled
    enabledAt: settings.enabled 
      ? (previousSettings.enabled ? previousSettings.enabledAt : new Date().toISOString())
      : null
  };
  lastFetchTime = Date.now();
  return maintenanceSettings;
}