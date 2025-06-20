
import type { FC } from 'react';

interface AnimatedDeliveryScooterProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const AnimatedDeliveryScooter: FC<AnimatedDeliveryScooterProps> = ({ className, width = "100%", height = "100%" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 75" // Adjusted viewBox for a wider aspect ratio
      xmlns="http://www.w3.org/2000/svg"
      className={className} // Handles sizing and text color for currentColor
    >
      <style>
        {`
          .scooter-group {
            animation: scooterBounce 1.5s ease-in-out infinite;
          }
          @keyframes scooterBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2.5px); } /* Subtle bounce */
          }
          .speed-line {
            stroke: currentColor; /* Inherits color from text-accent or similar */
            stroke-width: 2.5;
            stroke-linecap: round;
          }
          .speed-line-1 { animation: speedLineAnim 1.2s linear infinite 0s; }
          .speed-line-2 { animation: speedLineAnim 1.2s linear infinite 0.2s; }
          .speed-line-3 { animation: speedLineAnim 1.2s linear infinite 0.4s; }
          
          @keyframes speedLineAnim {
            0% { opacity: 1; transform: translateX(0px); }
            70% { opacity: 0.2; transform: translateX(-15px); } 
            100% { opacity: 0; transform: translateX(-18px); }
          }
        `}
      </style>
      <g className="scooter-group">
        {/* Speed Lines (drawn first to be behind scooter if it moves over them) */}
        <line className="speed-line speed-line-1" x1="25" y1="40" x2="5" y2="40" />
        <line className="speed-line speed-line-2" x1="20" y1="45" x2="0" y2="45" />
        <line className="speed-line speed-line-3" x1="22" y1="50" x2="8" y2="50" />

        {/* Rider */}
        <g fill="currentColor"> {/* Rider main color */}
          <circle cx="52" cy="23" r="6" /> {/* Helmet */}
          {/* Rider Body Path: Starts from neck, goes down for torso, forms a basic leg shape, then back up. */}
          <path d="M52,29 v15 l8,3 v-5 l-3,-1 l-0.5,-9 Z" />
          {/* Rider Arm */}
          <line x1="53" y1="32" x2="65" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        </g>

        {/* Scooter */}
        <g fill="currentColor"> {/* Scooter main color */}
          {/* Scooter Main Body: Includes seat area and back fender */}
          <path d="M35,58 q -5,-12 10,-15 l 20,0 q 10,0 15,8 l 0,8 c 0,5 -2,5 -5,5 l -12,0 l -3,5 l -27,0 Z" />
          {/* Scooter Front Panel/Shield */}
          <path d="M70,43 q 10,0 15,10 l 0,10 l -10,0 q -2,-5 -5,-6 Z" />
          {/* Handlebars */}
          <line x1="68" y1="28" x2="72" y2="26" stroke="currentColor" strokeWidth="2.5" />
          <line x1="65" y1="30" x2="68" y2="28" stroke="currentColor" strokeWidth="2.5" />
        </g>
        
        {/* Wheels */}
        {/* Back Wheel */}
        <circle cx="43" cy="62" r="7" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="1.5" /> {/* Tire */}
        <circle cx="43" cy="62" r="2.5" fill="currentColor" /> {/* Hub */}
        {/* Front Wheel */}
        <circle cx="78" cy="62" r="7" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="1.5" /> {/* Tire */}
        <circle cx="78" cy="62" r="2.5" fill="currentColor" /> {/* Hub */}

        {/* Package */}
        <g>
          {/* Package Box: Using card color for fill and card-foreground for straps */}
          <rect x="38" y="32" width="12" height="12" rx="1.5" ry="1.5" fill="hsl(var(--card))" stroke="hsl(var(--card-foreground))" strokeWidth="0.75" />
          {/* Package Straps */}
          <line x1="38" y1="38" x2="50" y2="38" stroke="hsl(var(--card-foreground))" strokeWidth="0.75" /> {/* Horizontal strap */}
          <line x1="44" y1="32" x2="44" y2="44" stroke="hsl(var(--card-foreground))" strokeWidth="0.75" /> {/* Vertical strap */}
        </g>
      </g>
    </svg>
  );
};

export default AnimatedDeliveryScooter;
