import React from 'react';

interface VerificationBadgeProps {
  level: 1 | 2 | 3;
}

export function VerificationBadge({ level }: VerificationBadgeProps) {
  let color = '#C8374F'; // default red
  let text = 'User submitted';

  if (level === 1) {
    color = '#22963F'; // green
    text = 'Hospital verified';
  } else if (level === 2) {
    color = '#D4A017'; // amber
    text = 'Doc pending';
  }

  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium px-2 py-1 bg-gray-50 rounded-full border border-gray-200">
      <span
        style={{ backgroundColor: color }}
        className="w-2 h-2 rounded-full inline-block"
      />
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
