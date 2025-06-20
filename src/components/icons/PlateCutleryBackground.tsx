// src/components/icons/PlateCutleryBackground.tsx
import type { FC } from 'react';

interface PlateCutleryBackgroundProps {
  className?: string;
}

const PlateCutleryBackground: FC<PlateCutleryBackgroundProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true" // Decorative
      preserveAspectRatio="xMidYMid slice" // Ensures the SVG covers the area, might crop
    >
      {/* Outer plate rim - using accent */}
      <circle cx="50" cy="50" r="48" fill="hsl(var(--accent))" />
      {/* Inner plate surface - using primary */}
      <circle cx="50" cy="50" r="40" fill="hsl(var(--primary))" />

      {/* Fork (on the left) - using primary-foreground (likely white) */}
      <g fill="hsl(var(--primary-foreground))">
        {/* Fork Handle */}
        <rect x="30" y="35" width="8" height="35" rx="3" />
        {/* Fork Head (base part connecting to tines) */}
        <rect x="26" y="28" width="16" height="10" rx="2" />
        {/* Fork Tines (3 tines) */}
        <rect x="28" y="18" width="4" height="12" />
        <rect x="33" y="18" width="4" height="12" />
        <rect x="38" y="18" width="4" height="12" />
      </g>

      {/* Spoon (on the right) - using primary-foreground */}
      <g fill="hsl(var(--primary-foreground))">
        {/* Spoon Bowl */}
        <ellipse cx="66" cy="28" rx="10" ry="13" />
        {/* Spoon Handle */}
        <rect x="62" y="38" width="8" height="32" rx="3" />
      </g>
    </svg>
  );
};

export default PlateCutleryBackground;
