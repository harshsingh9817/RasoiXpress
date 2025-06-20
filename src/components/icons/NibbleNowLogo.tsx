
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow logo - a food cloche with spoon, fork, and knife, and the name NibbleNow">
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="hsl(var(--primary))"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
        aria-hidden="true"
      >
        {/* Tray */}
        <rect x="10" y="70" width="80" height="10" rx="3" />

        {/* Cloche Dome */}
        <path d="M15 70 Q15 40 50 40 T85 70 Z" />
        
        {/* Cloche Handle */}
        <rect x="45" y="30" width="10" height="10" rx="2" />

        {/* Spoon (Left) */}
        <path d="M35 70 Q35 55 30 45 A5 5 0 1 0 30 55 Q35 65 35 70Z" transform="rotate(10 32.5 57.5)" fill="hsl(var(--card))" />
        <rect x="33" y="52" width="4" height="18" rx="1" transform="rotate(10 35 61)" fill="hsl(var(--card))" />


        {/* Fork (Center) */}
        <rect x="48" y="45" width="4" height="25" rx="1" fill="hsl(var(--card))" />
        <path d="M46 45 L46 50 L44 50 L44 45 Z" fill="hsl(var(--card))" />
        <path d="M50 45 L50 52 L49 52 L49 45 Z" fill="hsl(var(--card))" />
        <path d="M54 45 L54 50 L56 50 L56 45 Z" fill="hsl(var(--card))" />
        
        {/* Knife (Right) */}
        <path d="M65 70 L65 45 L68 45 Q70 50 68 70 Z" fill="hsl(var(--card))"/>
        <rect x="63" y="52" width="4" height="18" rx="1" transform="rotate(-10 65 61)" fill="hsl(var(--card))"/>

      </svg>
      <span className="text-2xl font-bold text-primary font-headline">
        NibbleNow
      </span>
    </div>
  );
};

export default NibbleNowLogo;
