
import type { FC } from 'react';

interface AnimatedDeliveryScooterProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const AnimatedDeliveryScooter: FC<AnimatedDeliveryScooterProps> = ({ className, width = "100%", height = "100%" }) => {
  const scooterBodyColor = "#A0AEC0"; // Medium Gray (Tailwind gray.500)
  const seatColor = "#2D3748"; // Dark Gray (Tailwind gray.800 - for seat and main handlebar parts)
  const wheelTireColor = "#2D3748"; // Dark Gray (Tailwind gray.800 - for tires)
  const wheelRimColor = "#E2E8F0"; // Light Gray (Tailwind gray.200 - for rims and handlebar grips)
  const riderAndBoxColor = "#2D3748"; // Dark Gray (Tailwind gray.800 - for rider and box silhouette)
  const roadColor = "#4A5568"; // Tailwind gray.700 for asphalt
  const roadLineColor = "#E2E8F0"; // Tailwind gray.200 for markings

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 85" // Increased height for road
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
          .road-line {
            stroke-dasharray: 15 25; /* 15px dash, 25px gap */
            stroke-linecap: round;
            animation: dashAnim 0.8s linear infinite;
          }
          @keyframes dashAnim {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: 40; } /* Animate by length of dash + gap (positive makes it move left) */
          }
        `}
      </style>
      
      {/* Road */}
      <g id="road">
        <rect x="-5" y="70" width="110" height="15" fill={roadColor} />
        <line className="road-line" x1="-5" y1="77.5" x2="105" y2="77.5" stroke={roadLineColor} strokeWidth="1.5" />
      </g>
      
      <g className="scooter-group">
        {/* Rider */}
        <g fill={riderAndBoxColor}>
          {/* Helmet */}
          <path d="M52,15 q -7,0 -7,7 q 0,7 7,7 q 7,0 7,-7 q 0,-7 -7,-7 M 52,29 L 58,29 L 58,22 Q 58,15 52,15" />
          {/* Body */}
          <path d="M52,29 v15 l8,3 v-5 l-3,-1 l-0.5,-9 Z" />
          {/* Arm */}
          <path d="M53,32 L65,30 L64,27 L52,29 Z" />
        </g>

        {/* Scooter */}
        {/* Main Body (under seat and rear fender part) */}
        <path d="M35,58 q -5,-12 10,-15 l 20,0 q 10,0 15,8 l 0,3 q -5,-2 -15,-2 l -20,0 q -10,3 -8,12 Z" fill={scooterBodyColor} />
        {/* Seat */}
        <path d="M50,43 l 15,0 q 5,0 8,5 l0,5 c0,2 -2,3 -5,3 l -15,0 Z" fill={seatColor} />
         {/* Rear Fender part above wheel */}
        <path d="M35,58 l20,0 l-3,5 l-17,0 Z" fill={scooterBodyColor} />


        {/* Front Panel/Shield */}
        <path d="M70,43 q 10,0 15,10 l 0,10 l -10,0 q -2,-5 -5,-6 Z" fill={scooterBodyColor} />
        
        {/* Handlebars - Revised for better visibility and realism */}
        <g>
          {/* Steering Column: Connects front panel (around x=72, y=43) to handlebar base (around x=65, y=31) */}
          <line x1="72" y1="43" x2="65" y2="31" stroke={seatColor} strokeWidth="4" strokeLinecap="round" />
          
          {/* Horizontal Bar: Centered on steering column top (x=65, y=31). Length 14 (x=58 to x=72). */}
          <rect x="58" y="29" width="14" height="4" rx="1" fill={seatColor} />
          
          {/* Left Grip: at x=58 end of bar */}
          <rect x="56" y="28" width="5" height="6" rx="2" fill={wheelRimColor} />
          {/* Right Grip: at x=72 end of bar. Aligns with rider hand near (65,30)/(64,27) */}
          <rect x="69" y="28" width="5" height="6" rx="2" fill={wheelRimColor} />

          {/* Simplified Brake levers - angled down and slightly forward from grips */}
          <line x1="58" y1="33" x2="56" y2="37" stroke={seatColor} strokeWidth="1.5" /> {/* Left lever */}
          <line x1="71" y1="33" x2="73" y2="37" stroke={seatColor} strokeWidth="1.5" /> {/* Right lever */}
        </g>

        {/* Package Box and Text */}
        <g>
          <rect x="38" y="30" width="18" height="15" rx="1.5" ry="1.5" fill={riderAndBoxColor} />
          <text
            x="47"
            y="35.5"
            fontFamily="Georgia, serif"
            fontSize="4"
            fontWeight="bold"
            fill={wheelRimColor}
            textAnchor="middle"
          >
            <tspan>Rasoi</tspan>
            <tspan x="47" dy="4.5">
              Xpress
            </tspan>
          </text>
        </g>
        
        {/* Wheels */}
        {/* Back Wheel */}
        <circle cx="43" cy="62" r="8" fill={wheelTireColor} /> 
        <circle cx="43" cy="62" r="4" fill={wheelRimColor} /> 

        {/* Front Wheel */}
        <circle cx="78" cy="62" r="8" fill={wheelTireColor} /> 
        <circle cx="78" cy="62" r="3.5" fill={wheelRimColor} />
         {/* Front wheel connection to body (fork) */}
        <path d="M78,60 Q75,50 72,43" stroke={scooterBodyColor} strokeWidth="3" fill="none"/>

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
    
