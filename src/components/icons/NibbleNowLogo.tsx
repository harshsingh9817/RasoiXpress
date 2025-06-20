
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow logo with plate and spoon icon and name">
      <svg
        className="h-10 w-10 mr-2"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Plate outline and fill */}
        <circle cx="50" cy="50" r="40" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="4"/>
        
        {/* Spoon */}
        {/* Spoon bowl (ellipse) */}
        <ellipse cx="50" cy="40" rx="15" ry="20" fill="hsl(var(--primary))"/>
        {/* Spoon handle (rectangle) */}
        <rect x="45" y="55" width="10" height="30" rx="3" fill="hsl(var(--primary))"/>
      </svg>
      <span className="text-2xl font-bold text-primary font-headline">
        NibbleNow
      </span>
    </div>
  );
};

export default NibbleNowLogo;
