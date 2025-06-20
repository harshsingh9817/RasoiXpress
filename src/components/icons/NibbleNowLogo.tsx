
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow logo - a plate with a fork and spoon, and the name NibbleNow">
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
        aria-hidden="true"
      >
        {/* Outer Plate (lighter) */}
        <circle cx="50" cy="50" r="45" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        {/* Inner Plate (primary color) */}
        <circle cx="50" cy="50" r="35" fill="hsl(var(--primary))" />

        {/* Fork */}
        <rect x="30" y="25" width="8" height="50" rx="2" fill="hsl(var(--card))" />
        {/* Fork prongs */}
        <rect x="30" y="20" width="2" height="10" fill="hsl(var(--card))" />
        <rect x="33" y="20" width="2" height="10" fill="hsl(var(--card))" />
        <rect x="36" y="20" width="2" height="10" fill="hsl(var(--card))" />
        
        {/* Spoon */}
        <ellipse cx="65" cy="35" rx="10" ry="12" fill="hsl(var(--card))" />
        <rect x="62" y="45" width="6" height="30" rx="2" fill="hsl(var(--card))" />
      </svg>
      <span className="text-2xl font-bold text-primary font-headline">
        NibbleNow
      </span>
    </div>
  );
};

export default NibbleNowLogo;
