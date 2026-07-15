/**
 * Haversine formula — calculates the great-circle distance between two points
 * on the Earth's surface (in kilometers).
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Returns the notification radius (in km) based on how long ago
 * a blood request was created (radius-expanding algorithm).
 *
 * Phase 1 (0–30 min):   5 km
 * Phase 2 (30–60 min): 15 km
 * Phase 3 (1–2 hr):    30 km
 * Phase 4 (2 hr+):     entire city (Infinity)
 */
export function getNotificationRadius(createdAt: Date): number {
  const minutesElapsed = (Date.now() - createdAt.getTime()) / 60_000

  if (minutesElapsed < 30) return 5
  if (minutesElapsed < 60) return 15
  if (minutesElapsed < 120) return 30
  return Infinity // entire city
}

/** Format distance for display */
export function formatDistance(km: number): string {
  if (km === Infinity) return "City-wide"
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
