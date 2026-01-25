export const EVENT_TYPES = [
  { value: "donation_camp", label: "Blood Donation Camp" },
  { value: "platelet_drive", label: "Platelet Donation Drive" },
  { value: "awareness_seminar", label: "Awareness Seminar" },
  { value: "donor_appreciation", label: "Donor Appreciation Event" },
  { value: "emergency_camp", label: "Emergency Blood Camp" },
  { value: "health_checkup", label: "Health Checkup Camp" },
  { value: "community_outreach", label: "Community Outreach" },
  { value: "blood_screening", label: "Blood Screening Camp" },
  { value: "volunteer_training", label: "Volunteer Training" },
  { value: "fundraising", label: "Fundraising Event" }
] as const

export type EventType = typeof EVENT_TYPES[number]['value']

export const getEventTypeLabel = (value: string): string => {
  const eventType = EVENT_TYPES.find(type => type.value === value)
  return eventType?.label || value
}

export const getEventTypeLabels = (values: string[]): string[] => {
  return values.map(value => getEventTypeLabel(value))
}

export const DEFAULT_EVENT_TYPES = ["donation_camp"]