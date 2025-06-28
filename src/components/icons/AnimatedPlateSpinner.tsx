
"use client";

import type { FC } from 'react';

interface AnimatedPlateSpinnerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const AnimatedPlateSpinner: FC<AnimatedPlateSpinnerProps> = ({ className, width = "100%", height = "100%" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>
        {`
          .spinner-group {
            animation: spin 1.2s linear infinite;
            transform-origin: center;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <g className="spinner-group">
        {/* Outer plate rim - using accent */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(var(--accent))" strokeWidth="4" />
        {/* Inner plate surface - using primary */}
        <circle cx="50" cy="50" r="40" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />

        {/* Fork (on the left) - using foreground */}
        <g fill="hsl(var(--foreground))" transform="rotate(-15 50 50)">
          {/* Fork Handle */}
          <rect x="28" y="35" width="6" height="30" rx="3" />
          {/* Fork Head */}
          <rect x="25" y="28" width="12" height="10" rx="2" />
          {/* Fork Tines */}
          <rect x="26" y="18" width="3" height="12" />
          <rect x="30" y="18" width="3" height="12" />
          <rect x="34" y="18" width="3" height="12" />
        </g>

        {/* Spoon (on the right) - using foreground */}
        <g fill="hsl(var(--foreground))" transform="rotate(15 50 50)">
          {/* Spoon Bowl */}
          <ellipse cx="66" cy="28" rx="8" ry="11" />
          {/* Spoon Handle */}
          <rect x="63" y="38" width="6" height="30" rx="3" />
        </g>
      </g>
    </svg>
  );
};

export default AnimatedPlateSpinner;
