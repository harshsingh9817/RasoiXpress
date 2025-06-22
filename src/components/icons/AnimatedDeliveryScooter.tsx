
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
  
  // New colors for buildings
  const buildingColor1 = "#CBD5E0"; // gray.400
  const buildingColor2 = "#E2E8F0"; // gray.300
  const buildingColor3 = "#BEE3F8"; // blue.200 - for a bit of variety
  const buildingTextColor = "hsl(var(--primary))"; // Red color from theme
  const newPatternWidth = 220; // Increased width for the new buildings

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
            transform: translateZ(0); /* Optimization: Promote to own layer */
          }
          @keyframes scooterBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); } /* Subtle bounce */
          }
          .speed-line {
            stroke: currentColor; 
            stroke-width: 2.5;
            stroke-linecap: round;
            will-change: transform, opacity; /* Optimization: Hint to browser */
          }
          .speed-line-1 { animation: speedLineAnim 1.2s linear infinite 0s; }
          .speed-line-2 { animation: speedLineAnim 1.2s linear infinite 0.2s; }
          .speed-line-3 { animation: speedLineAnim 1.2s linear infinite 0.4s; }
          
          @keyframes speedLineAnim {
            0% { opacity: 1; transform: translateX(0px); }
            70% { opacity: 0.2; transform: translateX(-15px); } 
            100% { opacity: 0; transform: translateX(-18px); }
          }
          
          /* New Road Line Animation for better performance */
          .road-lines-group {
            animation: dashAnim 0.8s linear infinite;
            will-change: transform; /* Optimization: Hint to browser */
          }
          @keyframes dashAnim {
              from { transform: translateX(0); }
              to { transform: translateX(-40px); } /* Animate with transform, not stroke-dashoffset */
          }

          .buildings-scrolling {
            animation: scrollBuildings 12s linear infinite;
            will-change: transform; /* Optimization: Hint to browser */
            transform: translateZ(0); /* Optimization: Promote to own layer */
          }
          @keyframes scrollBuildings {
            from { transform: translateX(0); }
            to { transform: translateX(-${newPatternWidth}px); } /* Width of the new building pattern */
          }
        `}
      </style>
      
      {/* Background Buildings */}
      <g id="background-buildings">
        <g className="buildings-scrolling">
            {/* Pattern 1 */}
            <rect x="0" y="30" width="20" height="40" fill={buildingColor1} />
            <rect x="5" y="50" width="10" height="5" fill={seatColor} opacity="0.5"/>
            <text x="10" y="40" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x="10" dy="0">sandhya</tspan>
                <tspan x="10" dy="4">sweets</tspan>
            </text>

            <rect x="25" y="20" width="15" height="50" fill={buildingColor2} />
            <rect x="28" y="30" width="9" height="5" fill={seatColor} opacity="0.5"/>
            <rect x="28" y="40" width="9" height="5" fill={seatColor} opacity="0.5"/>
            
            <rect x="45" y="40" width="25" height="30" fill={buildingColor3} />
            <text x="57.5" y="50" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x="57.5" dy="0">Prakash</tspan>
                <tspan x="57.5" dy="4">Vastralaya</tspan>
            </text>

            <rect x="75" y="10" width="30" height="60" fill={buildingColor1} />
            <rect x="78" y="15" width="24" height="5" fill={seatColor} opacity="0.5"/>
            <rect x="78" y="25" width="24" height="5" fill={seatColor} opacity="0.5"/>
            <text x="90" y="20" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x="90" dy="0">City</tspan>
                <tspan x="90" dy="4">Mega</tspan>
                <tspan x="90" dy="4">Mart</tspan>
            </text>

            <rect x="110" y="35" width="20" height="35" fill={buildingColor2} />
             <text x="120" y="45" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x="120" dy="0">Google</tspan>
                <tspan x="120" dy="4">Mens</tspan>
                <tspan x="120" dy="4">Wear</tspan>
            </text>
            
            {/* New Buildings */}
            <rect x="135" y="5" width="30" height="65" fill={buildingColor2} />
            <rect x="140" y="12" width="20" height="16" fill={seatColor} opacity="0.3" rx="1"/>
             <text x="150" y="15" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x="150" dy="0">Computer</tspan>
                <tspan x="150" dy="4">Skill</tspan>
                <tspan x="150" dy="4">Academy</tspan>
            </text>
            <rect x="170" y="25" width="35" height="45" fill={buildingColor1} />
            <rect x="175" y="35" width="10" height="5" fill={seatColor} opacity="0.5"/>
            <rect x="190" y="35" width="10" height="5" fill={seatColor} opacity="0.5"/>
            <text x="187.5" y="35" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x="187.5" dy="0">Shiv Shakti</tspan>
                <tspan x="187.5" dy="4">Creation</tspan>
            </text>

            {/* Pattern 2 (repeat of pattern 1 for looping) */}
            <rect x={0 + newPatternWidth} y="30" width="20" height="40" fill={buildingColor1} />
            <rect x={5 + newPatternWidth} y="50" width="10" height="5" fill={seatColor} opacity="0.5"/>
            <text x={10 + newPatternWidth} y="40" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x={10 + newPatternWidth} dy="0">sandhya</tspan>
                <tspan x={10 + newPatternWidth} dy="4">sweets</tspan>
            </text>

            <rect x={25 + newPatternWidth} y="20" width="15" height="50" fill={buildingColor2} />
            <rect x={28 + newPatternWidth} y="30" width="9" height="5" fill={seatColor} opacity="0.5"/>
            <rect x={28 + newPatternWidth} y="40" width="9" height="5" fill={seatColor} opacity="0.5"/>
            
            <rect x={45 + newPatternWidth} y="40" width="25" height="30" fill={buildingColor3} />
            <text x={57.5 + newPatternWidth} y="50" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x={57.5 + newPatternWidth} dy="0">Prakash</tspan>
                <tspan x={57.5 + newPatternWidth} dy="4">Vastralaya</tspan>
            </text>

            <rect x={75 + newPatternWidth} y="10" width="30" height="60" fill={buildingColor1} />
            <rect x={78 + newPatternWidth} y="15" width="24" height="5" fill={seatColor} opacity="0.5"/>
            <rect x={78 + newPatternWidth} y="25" width="24" height="5" fill={seatColor} opacity="0.5"/>
            <text x={90 + newPatternWidth} y="20" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x={90 + newPatternWidth} dy="0">City</tspan>
                <tspan x={90 + newPatternWidth} dy="4">Mega</tspan>
                <tspan x={90 + newPatternWidth} dy="4">Mart</tspan>
            </text>

            <rect x={110 + newPatternWidth} y="35" width="20" height="35" fill={buildingColor2} />
             <text x={120 + newPatternWidth} y="45" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x={120 + newPatternWidth} dy="0">Google</tspan>
                <tspan x={120 + newPatternWidth} dy="4">Mens</tspan>
                <tspan x={120 + newPatternWidth} dy="4">Wear</tspan>
            </text>

             {/* New Buildings - Repeated */}
            <rect x={135 + newPatternWidth} y="5" width="30" height="65" fill={buildingColor2} />
            <rect x={140 + newPatternWidth} y="12" width="20" height="16" fill={seatColor} opacity="0.3" rx="1"/>
             <text x={150 + newPatternWidth} y="15" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x={150 + newPatternWidth} dy="0">Computer</tspan>
                <tspan x={150 + newPatternWidth} dy="4">Skill</tspan>
                <tspan x={150 + newPatternWidth} dy="4">Academy</tspan>
            </text>
            <rect x={170 + newPatternWidth} y="25" width="35" height="45" fill={buildingColor1} />
            <rect x={175 + newPatternWidth} y="35" width="10" height="5" fill={seatColor} opacity="0.5"/>
            <rect x={190 + newPatternWidth} y="35" width="10" height="5" fill={seatColor} opacity="0.5"/>
            <text x={187.5 + newPatternWidth} y="35" fontFamily="Arial, sans-serif" fontSize="3" fontWeight="bold" fill={buildingTextColor} textAnchor="middle">
                <tspan x={187.5 + newPatternWidth} dy="0">Shiv Shakti</tspan>
                <tspan x={187.5 + newPatternWidth} dy="4">Creation</tspan>
            </text>
        </g>
      </g>
      
      {/* Road */}
      <g id="road">
        <rect x="-5" y="70" width="110" height="15" fill={roadColor} />
        {/* The road lines are now a group of lines that are moved with a CSS transform for better performance */}
        <g className="road-lines-group" stroke={roadLineColor} strokeWidth="1.5" strokeLinecap="round">
          {/* These lines repeat every 40 units to create a seamless loop */}
          <line x1="-5" y1="77.5" x2="10" y2="77.5" />
          <line x1="35" y1="77.5" x2="50" y2="77.5" />
          <line x1="75" y1="77.5" x2="90" y2="77.5" />
          <line x1="115" y1="77.5" x2="130" y2="77.5" />
        </g>
      </g>
      
      <g className="scooter-group" transform="translate(12, 14) scale(0.8)">
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
