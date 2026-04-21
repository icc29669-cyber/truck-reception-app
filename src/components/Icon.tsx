import React from "react";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

const base = (size: number, strokeWidth: number, className?: string, style?: React.CSSProperties) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  style,
  "aria-hidden": true,
});

export function TruckIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M3 7.5h11v9H3z" />
      <path d="M14 10.5h4l3 3V16.5h-7z" />
      <circle cx="7" cy="17.5" r="1.75" />
      <circle cx="17" cy="17.5" r="1.75" />
    </svg>
  );
}

export function CenterIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M3.5 20.5v-9l5 3v-3l5 3V8.5l7-4v16z" />
      <path d="M3 20.5h18" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function ListIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}

export function UserIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function SettingsIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function CheckIcon({ size = 24, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  );
}

export function AlertIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M10.3 3.5 2.5 17.5a2 2 0 0 0 1.75 3h15.5a2 2 0 0 0 1.75-3L13.7 3.5a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17.25v.01" />
    </svg>
  );
}

export function BlockIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5l13 13" />
    </svg>
  );
}

export function KeyIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <circle cx="8" cy="14" r="4" />
      <path d="M11 11.5 21 2m-4 4 2 2m-5 1 2 2" />
    </svg>
  );
}

export function NumPadIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
    </svg>
  );
}

export function PhoneIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

export function PencilIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M4 20h4l10-10-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function TicketIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M3 8v-1a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4z" />
      <path d="M10 5v14" strokeDasharray="2 2" />
    </svg>
  );
}

export function CoffeeIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M16 11h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 3c0 1.5 1 2 1 3.5M11 3c0 1.5 1 2 1 3.5" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 24, strokeWidth = 2, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function LogoutIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M9 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function InstallIcon({ size = 24, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg {...base(size, strokeWidth, className, style)}>
      <path d="M12 3v12m0 0-4-4m4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
