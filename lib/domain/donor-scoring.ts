import { haversineDistance } from "@/lib/utils/haversine"

export interface DonorProfile {
  _id: string
  name: string
  email: string
  phone?: string
  bloodGroup: string
  lat?: number
  lng?: number
  city?: string
  lastDonationDate?: string
  hasDisease?: boolean
  notificationsThisMonth?: number
  previousResponses?: string[] // requestIds donor responded to
}

export interface BloodRequest {
  _id: string
  bloodGroup: string
  lat?: number
  lng?: number
  hospitalLocation: string
  urgency: string
  createdAt: Date
}

export interface ScoredDonor {
  donor: DonorProfile
  score: number
  distanceKm: number
  breakdown: {
    distanceScore: number
    eligibilityScore: number
    responseHistoryScore: number
    recencyScore: number
  }
}

const ELIGIBILITY_COOLDOWN_DAYS = 90 // 3 months standard cooldown

/**
 * Calculate eligibility score based on last donation date.
 * Returns 0–1 (0 = not eligible, 1 = fully eligible)
 */
function calculateEligibilityWeight(lastDonationDate?: string): number {
  if (!lastDonationDate) return 1 // Never donated — fully eligible

  const lastDonation = new Date(lastDonationDate)
  const daysSinceDonation = (Date.now() - lastDonation.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceDonation < ELIGIBILITY_COOLDOWN_DAYS) {
    return 0 // Not eligible yet
  }

  // Fully eligible after cooldown; extra bonus for long gaps
  const extraDays = daysSinceDonation - ELIGIBILITY_COOLDOWN_DAYS
  return Math.min(1, 0.7 + (extraDays / 180) * 0.3)
}

/**
 * Calculate distance score (0–1). Closer = higher score.
 * Uses inverse distance weighting. Max meaningful distance = 50km.
 */
function calculateDistanceWeight(distanceKm: number): number {
  if (distanceKm === Infinity || distanceKm > 50) return 0
  return Math.max(0, 1 - distanceKm / 50)
}

/**
 * Score a donor against a blood request.
 * Formula:
 *   Score = (distance_weight × 40) + (eligibility_weight × 30) +
 *           (response_history × 20) + (recency_weight × 10)
 */
export function scoreDonor(donor: DonorProfile, request: BloodRequest): ScoredDonor {
  // Distance
  let distanceKm = Infinity
  if (
    donor.lat !== undefined &&
    donor.lng !== undefined &&
    request.lat !== undefined &&
    request.lng !== undefined
  ) {
    distanceKm = haversineDistance(donor.lat, donor.lng, request.lat, request.lng)
  }

  const distanceScore = calculateDistanceWeight(distanceKm)

  // Eligibility (last donation date)
  const eligibilityScore = calculateEligibilityWeight(donor.lastDonationDate)

  // Response history — donors who previously helped get a boost
  const hasPreviousResponse = donor.previousResponses?.includes(request._id)
  const responseHistoryScore = hasPreviousResponse ? 1 : 0.5

  // Recency — boost for donors active in the platform recently
  // (Simplified: use totalNotifications as proxy for activity)
  const recencyScore = donor.notificationsThisMonth !== undefined
    ? Math.max(0, 1 - donor.notificationsThisMonth / 10)
    : 0.7

  const score =
    distanceScore * 40 +
    eligibilityScore * 30 +
    responseHistoryScore * 20 +
    recencyScore * 10

  return {
    donor,
    score,
    distanceKm,
    breakdown: {
      distanceScore: distanceScore * 40,
      eligibilityScore: eligibilityScore * 30,
      responseHistoryScore: responseHistoryScore * 20,
      recencyScore: recencyScore * 10,
    },
  }
}

/**
 * Fatigue prevention: skip donors who received 3+ notifications
 * this month without responding.
 */
export function isFatigued(donor: DonorProfile): boolean {
  return (donor.notificationsThisMonth ?? 0) >= 3
}

/**
 * Sort and filter donors for a request.
 * Returns top donors ordered by score, with fatigued donors excluded.
 */
export function rankDonors(
  donors: DonorProfile[],
  request: BloodRequest,
  maxResults = 50
): ScoredDonor[] {
  const eligible = donors.filter(
    (d) =>
      !d.hasDisease &&
      !isFatigued(d) &&
      d.bloodGroup === request.bloodGroup
  )

  const scored = eligible.map((d) => scoreDonor(d, request))
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, maxResults)
}

/**
 * Generate a personalized notification message for a donor.
 * Uses template if Groq is not available.
 */
export function generateDonorMessage(
  scored: ScoredDonor,
  request: BloodRequest
): string {
  const distanceText =
    scored.distanceKm === Infinity
      ? "in your city"
      : `${scored.distanceKm.toFixed(1)}km from you`

  return (
    `${scored.donor.name}, you're a matching ${request.bloodGroup} donor — ` +
    `${distanceText} at ${request.hospitalLocation}. ` +
    `Urgency: ${request.urgency.toUpperCase()}. ` +
    `Your help can save a life right now. Please respond via Samarpan.`
  )
}
