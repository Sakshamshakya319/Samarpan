"use client"

import { cn } from "@/lib/utils/utils"
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react"

interface VerificationBadgeProps {
  level: 1 | 2 | 3
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const LEVEL_CONFIG = {
  1: {
    icon: ShieldCheck,
    label: "Document Verified",
    sublabel: "Hospital document uploaded & verified",
    bgColor: "bg-emerald-50 border-emerald-200",
    textColor: "text-emerald-800",
    iconColor: "text-emerald-600",
    dot: "bg-emerald-500",
    emoji: "🟢",
  },
  2: {
    icon: Shield,
    label: "Hospital Verified",
    sublabel: "Hospital verified, document pending",
    bgColor: "bg-amber-50 border-amber-200",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
    dot: "bg-amber-500",
    emoji: "🟡",
  },
  3: {
    icon: ShieldAlert,
    label: "Pending Verification",
    sublabel: "User-submitted, awaiting admin verification",
    bgColor: "bg-red-50 border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
    dot: "bg-red-500",
    emoji: "🔴",
  },
}

export function VerificationBadge({
  level,
  size = "md",
  showLabel = true,
  className,
}: VerificationBadgeProps) {
  const config = LEVEL_CONFIG[level]
  const Icon = config.icon

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
      title={config.sublabel}
    >
      <Icon className={cn(iconSizes[size], config.iconColor)} />
      {showLabel && (
        <span>
          Level {level} — {config.label}
        </span>
      )}
      {!showLabel && <span>Level {level}</span>}
    </div>
  )
}

/** Compact dot-only indicator */
export function VerificationDot({ level }: { level: 1 | 2 | 3 }) {
  const config = LEVEL_CONFIG[level]
  return (
    <span
      className={cn("inline-block w-2.5 h-2.5 rounded-full", config.dot)}
      title={`${config.emoji} ${config.label}: ${config.sublabel}`}
    />
  )
}

/** Full card with explanation */
export function VerificationCard({ level }: { level: 1 | 2 | 3 }) {
  const config = LEVEL_CONFIG[level]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "p-3 rounded-lg border flex items-start gap-3",
        config.bgColor
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.iconColor)} />
      <div>
        <p className={cn("text-sm font-semibold", config.textColor)}>
          {config.emoji} Trust Level {level} — {config.label}
        </p>
        <p className={cn("text-xs mt-0.5", config.textColor, "opacity-80")}>
          {config.sublabel}
        </p>
      </div>
    </div>
  )
}
