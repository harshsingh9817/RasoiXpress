
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow logo with a unique plate and two different spoons icon and name">
      <svg
        className="h-10 w-10 mr-2" // Icon size and margin
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Unique Plate - slightly irregular circle/oval */}
        <path 
          d="M50 10 Q20 20 22 50 T50 90 Q80 80 78 50 T50 10 Z" 
          fill="hsl(var(--card))" 
          stroke="hsl(var(--primary))" 
          strokeWidth="3"
        />
        
        {/* Spoon 1 - simpler handle */}
        {/* Spoon bowl (ellipse) */}
        <ellipse cx="40" cy="40" rx="8" ry="12" fill="hsl(var(--primary))" transform="rotate(-30 40 40)"/>
        {/* Spoon handle (rectangle) */}
        <rect x="30" y="50" width="5" height="25" rx="2" fill="hsl(var(--primary))" transform="rotate(-30 32.5 62.5)"/>

        {/* Spoon 2 - slightly more detailed or different orientation */}
        {/* Spoon bowl (ellipse) */}
        <ellipse cx="63" cy="42" rx="7" ry="11" fill="hsl(var(--primary))" transform="rotate(25 63 42)"/>
        {/* Spoon handle (tapered or different shape) */}
        <path d="M58 52 Q60 62 62 75 L60 76 Q58 63 56 53 Z" fill="hsl(var(--primary))" transform="rotate(25 60 64)"/>
      </svg>
      <span className="text-2xl font-bold text-primary font-headline">
        NibbleNow
      </span>
    </div>
  );
};

export default NibbleNowLogo;
