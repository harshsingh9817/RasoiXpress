
"use client";

import type { FC } from 'react';

interface AnimatedFoodPackingAndLoadingProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

const AnimatedFoodPackingAndLoading: FC<AnimatedFoodPackingAndLoadingProps> = ({ className, width = "100%", height = "100%" }) => {
  const foodColor = "hsl(var(--primary))"; 
  const foodHighlightColor = "hsl(var(--accent))";
  const boxColor = "hsl(35, 65%, 75%)"; 
  const boxStrokeColor = "hsl(35, 50%, 60%)";
  const scooterColor = "currentColor"; 
  const wheelColor = "hsl(var(--muted-foreground))";
  const detailColor = "hsl(var(--muted-foreground))"; 

  const foodAppearDelay = "0s";
  const foodAppearDuration = "0.5s";
  const boxAppearDelay = "0.2s";
  const boxAppearDuration = "0.3s";
  
  const foodMoveDelay = "0.5s"; 
  const foodMoveDuration = "1s";
  
  const flapCloseDelay = "1.5s"; 
  const flapCloseDuration = "0.5s";
  
  const vehicleAppearDelay = "2.0s";
  const vehicleAppearDuration = "0.5s";
  
  const boxToVehicleDelay = "2.5s"; 
  const boxToVehicleDuration = "1s";
  
  const vehiclePuffDelay = "3.5s";
  const vehiclePuffDuration = "0.5s";
  
  const loopDuration = "6s";
  // Fade in part of loop: 10% of loopDuration
  const fadeInDurationPercentage = 10;
  // Fade out part of loop: last 1s, so (loopDuration - 1s) / loopDuration * 100
  const fadeOutStartTimePercentage = ((parseFloat(loopDuration) - 1) / parseFloat(loopDuration)) * 100;


  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 100" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>
        {`
          .container-group { 
            animation: mainLoop ${loopDuration} linear infinite; 
          }
          @keyframes mainLoop {
            0% { opacity: 0; }
            ${fadeInDurationPercentage}% { opacity: 1; }
            ${fadeOutStartTimePercentage}% { opacity: 1; }
            100% { opacity: 0; }
          }

          .food-item {
            opacity: 0;
            animation: 
              foodAppearAnim ${foodAppearDuration} ease-out ${foodAppearDelay} forwards,
              foodMoveAndFadeAnim ${foodMoveDuration} ease-in-out ${foodMoveDelay} forwards;
            transform-origin: center;
          }
          @keyframes foodAppearAnim { 
            0% { opacity: 0; transform: translateY(10px) scale(0.9); } 
            100% { opacity: 1; transform: translateY(0) scale(1); } 
          }
          @keyframes foodMoveAndFadeAnim {
            0% { opacity: 1; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(30px, 10px) scale(0.5); } 
          }

          .packaging-box {
            opacity: 0;
            animation: boxAppearAnim ${boxAppearDuration} ease-out ${boxAppearDelay} forwards;
          }
          @keyframes boxAppearAnim { 
            0% { opacity: 0; transform: scale(0.8); } 
            100% { opacity: 1; transform: scale(1); } 
          }
          
          .box-lid {
            transform-origin: 0% 100%; 
            animation: lidCloseAnim ${flapCloseDuration} ease-in ${flapCloseDelay} forwards;
          }
          @keyframes lidCloseAnim {
            from { transform: rotateX(0deg) translateY(0px); }
            to { transform: rotateX(-100deg) translateY(2px) translateX(1px); } 
          }
          
          .packed-box-motion {
            animation: packedBoxToVehicleAnim ${boxToVehicleDuration} ease-in-out ${boxToVehicleDelay} forwards;
          }
          @keyframes packedBoxToVehicleAnim {
            0% { transform: translate(0, 0) scale(1); }
            20% { transform: translate(0, -5px) scale(1); } 
            100% { transform: translate(75px, -15px) scale(0.6); } 
          }

          .delivery-scooter {
            opacity: 0;
            transform: translateX(-20px);
            animation: scooterAppearAnim ${vehicleAppearDuration} ease-out ${vehicleAppearDelay} forwards;
          }
          @keyframes scooterAppearAnim {
            to { opacity: 1; transform: translateX(0); }
          }
          .scooter-puff {
            opacity: 0;
            transform-origin: center;
            animation: puffAnim ${vehiclePuffDuration} ease-out ${vehiclePuffDelay} forwards;
          }
          @keyframes puffAnim {
            0% { opacity: 0.8; transform: scale(0.5) translate(0,0); }
            100% { opacity: 0; transform: scale(1.2) translate(-10px, -5px); }
          }
        `}
      </style>
      
      <g className="container-group">
        
        <g className="food-item" transform="translate(20 65)">
          <rect x="0" y="0" width="22" height="5" rx="2.5" fill={foodHighlightColor} /> 
          <rect x="2" y="5" width="18" height="4" rx="1" fill={foodColor} /> 
          <rect x="1" y="4" width="20" height="2" rx="1" fill={foodHighlightColor} opacity="0.7"/> 
          <rect x="0" y="9" width="22" height="5" rx="2.5" fill={foodHighlightColor} /> 
        </g>

        <g className="packaging-box" transform="translate(50 60)">
          <g className="packed-box-motion">
            <path d="M0,0 h30 v20 h-30 Z" fill={boxColor} stroke={boxStrokeColor} strokeWidth="1"/> 
            <path d="M30,0 l10,-5 v20 l-10,5 Z" fill={boxColor} stroke={boxStrokeColor} strokeWidth="1" opacity="0.8"/>
            <path className="box-lid" d="M0,0 h30 l10,-5 h-30 Z" fill={boxColor} stroke={boxStrokeColor} strokeWidth="1"/>
          </g>
        </g>

        <g className="delivery-scooter" transform="translate(110 58)">
          <path d="M5,25 q-2,-8 8,-10 l15,0 q8,0 12,6 l0,6 q0,4 -3,4 l-10,0 l-2,4 l-20,0 Z" fill={scooterColor} />
          <path d="M28,15 q8,0 12,8 v8 l-8,0 q-1,-4 -4,-5 Z" fill={scooterColor} />
          <line x1="26" y1="5" x2="29" y2="3" stroke={scooterColor} strokeWidth="1.5" />
          <line x1="24" y1="7" x2="26" y2="5" stroke={scooterColor} strokeWidth="1.5" />
          <circle cx="10" cy="30" r="5" fill="hsl(var(--background))" stroke={wheelColor} strokeWidth="1"/>
          <circle cx="10" cy="30" r="1.5" fill={wheelColor} />
          <circle cx="35" cy="30" r="5" fill="hsl(var(--background))" stroke={wheelColor} strokeWidth="1"/>
          <circle cx="35" cy="30" r="1.5" fill={wheelColor} />
          <rect x="2" y="8" width="18" height="10" rx="1" fill={scooterColor} opacity="0.5" />
          <circle className="scooter-puff" cx="0" cy="28" r="4" fill={detailColor}/>
        </g>
      </g>
    </svg>
  );
};

export default AnimatedFoodPackingAndLoading;
