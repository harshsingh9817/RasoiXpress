
"use client";

import type { FC } from 'react';

interface AnimatedDeliveryCycleProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const AnimatedDeliveryCycle: FC<AnimatedDeliveryCycleProps> = ({ className, width = "100%", height = "100%" }) => {
  // Define HSL colors based on common theme variables or fixed values
  const backpackColor = "hsl(220, 75%, 55%)"; // A distinct blue
  const backpackHighlightColor = "hsl(220, 75%, 65%)";
  const helmetColor = "hsl(210, 20%, 30%)"; // Dark grey/blue
  const shirtColor = "hsl(200, 15%, 85%)"; // Light greyish blue
  const pantsColor = "hsl(210, 20%, 40%)"; // Medium grey/blue
  const skinColor = "hsl(35, 50%, 80%)"; // A light skin tone
  const maskColor = "hsl(190, 40%, 92%)"; // Very light blue/white

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 110" // Adjusted viewBox for aspect ratio
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>
        {`
          .cyclist-group {
            animation: cycleBounce 1.2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
          }
          @keyframes cycleBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-1.5px); }
          }
          .wheel {
            animation: spin 0.8s linear infinite;
            transform-origin: center;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .pedal-arm {
            animation: pedalSpin 1.6s linear infinite;
            transform-origin: 20% 0%; /* Approx center of crank */
          }
           @keyframes pedalSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
           .rider-leg-upper {
            animation: pedalLegUpper 1.6s linear infinite;
            transform-origin: 50% 0%; /* Hip joint */
          }
          .rider-leg-lower {
            animation: pedalLegLower 1.6s linear infinite;
            transform-origin: 50% 0%; /* Knee joint */
          }
          @keyframes pedalLegUpper {
            0% { transform: rotate(-20deg); }
            25% { transform: rotate(15deg); }
            50% { transform: rotate(30deg); }
            75% { transform: rotate(0deg); }
            100% { transform: rotate(-20deg); }
          }
          @keyframes pedalLegLower {
            0% { transform: rotate(30deg); }
            25% { transform: rotate(10deg); }
            50% { transform: rotate(-20deg); }
            75% { transform: rotate(40deg); }
            100% { transform: rotate(30deg); }
          }

          /* Basic spoke styling */
          .spoke {
            stroke: currentColor; /* Will take on text color like the frame */
            stroke-opacity: 0.5;
            stroke-width: 1;
          }
        `}
      </style>

      <g className="cyclist-group" transform="translate(5, 5)"> 
        {/* Backpack */}
        <rect x="38" y="15" width="34" height="40" rx="4" fill={backpackColor} strokeWidth="1" stroke="hsl(var(--border))"/>
        <rect x="40" y="17" width="30" height="8" rx="2" fill={backpackHighlightColor} opacity="0.6"/>
        <line x1="38" y1="35" x2="72" y2="35" stroke={backpackHighlightColor} strokeWidth="2.5" opacity="0.5"/>


        {/* Rider */}
        <g id="rider" fillRule="evenodd">
          {/* Torso */}
          <path d="M60,38 C58,45 58,55 60,62 L68,62 C70,55 70,45 68,38 Z" fill={shirtColor}/>
          {/* Pants/Seat Area */}
           <path d="M60,60 Q64,68 68,60 L68,63 Q64,71 60,63 Z" fill={pantsColor} />

          {/* Head & Helmet */}
          <circle cx="64" cy="27" r="7" fill={helmetColor} /> 
          <rect x="59" y="30" width="10" height="5" fill={skinColor} /> 
          <rect x="60" y="32" width="8" height="4" fill={maskColor} rx="1"/> 


          {/* Arms (simplified) */}
          <path d="M68,40 Q75,42 83,43 L85,40 Q77,39 69,38 Z" fill={shirtColor} /> 
          <circle cx="84" cy="41.5" r="2" fill={skinColor} /> 


          {/* Legs */}
          
          <g transform="translate(62 62)"> 
            <path d="M0,0 L2,15 L-2,15 Z" fill={pantsColor} className="rider-leg-upper"/> 
            <g transform="translate(0, 15)"> 
               <path d="M0,0 Q1,10 0,18 L-2,18 Q-3,10 -2,0 Z" fill={pantsColor} className="rider-leg-lower"/> 
               <ellipse cx="0" cy="18" rx="3" ry="2" fill={helmetColor} /> 
            </g>
          </g>
           
           <g transform="translate(66 62) rotate(15)">
            <path d="M0,0 L2,14 L-2,14 Z" fill={pantsColor} transform="rotate(120 0 0)"/>
            <g transform="translate(0, 14) rotate(10)">
                <path d="M0,0 Q1,8 0,14 L-2,14 Q-3,8 -2,0 Z" fill={pantsColor} transform="rotate(-100 0 0)" />
                 <ellipse cx="0" cy="14" rx="3" ry="2" fill={helmetColor} transform="rotate(-100 0 0)" />
            </g>
          </g>
        </g>

        {/* Bicycle */}
        <g id="bicycle" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Frame */}
          <path d="M45,85 L64,60 L90,60" /> 
          <path d="M64,60 L68,85" /> 
          <path d="M90,60 L105,85" /> 
          <path d="M90,60 Q88,48 83,45" /> 

          {/* Handlebars */}
          <path d="M78,40 L88,45" />

          {/* Seat */}
          <path d="M58,56 L70,56" strokeWidth="3" fill="currentColor"/>

          {/* Crank & Pedals */}
          <g transform="translate(64,85)" className="pedal-arm"> 
            
            <line x1="0" y1="0" x2="12" y2="3" strokeWidth="2.5" /> 
            
            <rect x="10" y="1" width="6" height="3" rx="0.5" strokeWidth="1" fill="currentColor"/>
          </g>
           <g transform="translate(64,85) rotate(180)" className="pedal-arm" style={{ animationDelay: '-0.8s' }}>
            <line x1="0" y1="0" x2="12" y2="3" strokeWidth="2.5" />
            <rect x="10" y="1" width="6" height="3" rx="0.5" strokeWidth="1" fill="currentColor"/>
          </g>
          <circle cx="64" cy="85" r="2" fill="currentColor" stroke="none" /> 


          {/* Wheels (drawn last to be on top of frame ends) */}
          <g className="wheel" transform="translate(45, 85)">
            <circle cx="0" cy="0" r="15" strokeWidth="2.5" fill="hsl(var(--background))" />
            <circle cx="0" cy="0" r="2.5" fill="currentColor" stroke="none"/>
            
            {[0, 45, 90, 135].map(angle => (
              <line key={`b_spoke_${angle}`} x1="0" y1="0" x2="0" y2="-13.5" transform={`rotate(${angle})`} className="spoke"/>
            ))}
          </g>
          <g className="wheel" transform="translate(105, 85)">
            <circle cx="0" cy="0" r="15" strokeWidth="2.5" fill="hsl(var(--background))" />
            <circle cx="0" cy="0" r="2.5" fill="currentColor" stroke="none"/>
             
            {[0, 45, 90, 135].map(angle => (
              <line key={`f_spoke_${angle}`} x1="0" y1="0" x2="0" y2="-13.5" transform={`rotate(${angle})`} className="spoke"/>
            ))}
          </g>
        </g>
      </g>
    </svg>
  );
};

export default AnimatedDeliveryCycle;
