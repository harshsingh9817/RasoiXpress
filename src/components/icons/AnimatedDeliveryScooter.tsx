
import type { FC } from 'react';

interface AnimatedDeliveryScooterProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const AnimatedDeliveryScooter: FC<AnimatedDeliveryScooterProps> = ({ className, width = "100%", height = "100%" }) => {
  const scooterFillColor = "#2D3748"; // Dark Gray

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 75" // Adjusted viewBox for a wider aspect ratio
      xmlns="http://www.w3.org/2000/svg"
      className={className} // Handles sizing and text color for currentColor (used by speed lines)
    >
      <style>
        {`
          .scooter-group {
            animation: scooterBounce 1.5s ease-in-out infinite;
          }
          @keyframes scooterBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); } /* Subtle bounce */
          }
          .speed-line {
            stroke: currentColor; 
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
      <g className="scooter-group" fill={scooterFillColor}>
        {/* Rider */}
        {/* Helmet */}
        <path d="M52,15 q -7,0 -7,7 q 0,7 7,7 q 7,0 7,-7 q 0,-7 -7,-7 M 52,29 L 58,29 L 58,22 Q 58,15 52,15" />
        {/* Body */}
        <path d="M52,29 v15 l8,3 v-5 l-3,-1 l-0.5,-9 Z" />
        {/* Arm */}
        <path d="M53,32 L65,30 L64,27 L52,29 Z" />

        {/* Scooter */}
        {/* Main Body + Seat + Rear Fender */}
        <path d="M35,58 q -5,-12 10,-15 l 20,0 q 10,0 15,8 l 0,8 c 0,5 -2,5 -5,5 l -12,0 l -3,5 l -27,0 Z" />
        {/* Front Panel/Shield */}
        <path d="M70,43 q 10,0 15,10 l 0,10 l -10,0 q -2,-5 -5,-6 Z" />
        {/* Handlebars area */}
        <rect x="63" y="26" width="6" height="4" rx="1" />


        {/* Package Box (part of the silhouette) */}
        <rect x="38" y="30" width="18" height="15" rx="1.5" ry="1.5" />
        
        {/* Wheels (solid, part of silhouette) */}
        <circle cx="43" cy="62" r="8" /> {/* Back Wheel */}
        <circle cx="78" cy="62" r="8" /> {/* Front Wheel */}

      </g>
      {/* Speed Lines - stroke based, will use 'currentColor' from className prop */}
      <g>
        <line className="speed-line speed-line-1" x1="40" y1="35" x2="15" y2="35" />
        <line className="speed-line speed-line-2" x1="35" y1="40" x2="10" y2="40" />
        <line className="speed-line speed-line-3" x1="38" y1="45" x2="13" y2="45" />

        <line className="speed-line speed-line-1" x1="30" y1="58" x2="5" y2="58" style={{animationDelay: '0.1s'}}/>
        <line className="speed-line speed-line-2" x1="25" y1="63" x2="0" y2="63" style={{animationDelay: '0.3s'}}/>
      </g>
    </svg>
  );
};

export default AnimatedDeliveryScooter;
    
