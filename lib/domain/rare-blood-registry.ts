/**
 * Rare Blood Group Registry utilities.
 * Donors with rare blood groups (O-, AB-, Bombay) can opt-in to be
 * contacted any time, including off-hours emergencies.
 */

export const RARE_BLOOD_GROUPS = ["O-", "AB-"] as const
export const BOMBAY_BLOOD_GROUPS = ["Bombay (Oh)"] as const

export type RareBloodGroup = (typeof RARE_BLOOD_GROUPS)[number]

/**
 * Check if a blood group qualifies as rare (for consent UI display).
 */
export function isRareBloodGroup(bloodGroup: string): boolean {
  return (
    (RARE_BLOOD_GROUPS as readonly string[]).includes(bloodGroup) ||
    (BOMBAY_BLOOD_GROUPS as readonly string[]).includes(bloodGroup)
  )
}

/**
 * Returns a human-readable description of why the blood group is rare.
 */
export function getRareGroupDescription(bloodGroup: string): string {
  switch (bloodGroup) {
    case "O-":
      return "O- is the universal donor — compatible with all blood groups. It's critically needed in emergencies when the patient's blood group is unknown."
    case "AB-":
      return "AB- donors can donate plasma to all blood groups. AB- whole blood is rare and valuable for emergency care."
    case "Bombay (Oh)":
      return "Bombay blood group (Oh) is extremely rare — only 1 in 10,000 people have it. These donors can only receive blood from other Bombay group donors."
    default:
      return ""
  }
}

/**
 * Returns urgency label for rare blood group registry.
 */
export function getRareGroupUrgencyLabel(bloodGroup: string): string {
  if (bloodGroup === "Bombay (Oh)") return "CRITICAL — Any-time emergency contact"
  if (bloodGroup === "O-") return "HIGH — Universal donor priority"
  if (bloodGroup === "AB-") return "HIGH — Universal plasma donor"
  return "RARE — Priority registry"
}

/**
 * Blood compatibility map (donor → can donate to).
 * Used for eligibility filtering when exact match unavailable.
 */
export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
  "Bombay (Oh)": ["Bombay (Oh)"],
}

/**
 * Returns blood groups this donor can donate to.
 */
export function getCompatibleRecipients(donorBloodGroup: string): string[] {
  return BLOOD_COMPATIBILITY[donorBloodGroup] ?? [donorBloodGroup]
}

/**
 * Returns which donor blood groups can donate to this patient.
 */
export function getCompatibleDonors(patientBloodGroup: string): string[] {
  return Object.entries(BLOOD_COMPATIBILITY)
    .filter(([, recipients]) => recipients.includes(patientBloodGroup))
    .map(([donor]) => donor)
}
