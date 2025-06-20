
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow restaurant logo - chef hat in a circle">
      <svg
        className="h-10 w-10"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Circular Frame */}
        <circle cx="50" cy="50" r="46" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="4" />

        {/* Chef Hat Puffy Part */}
        <path
          d="M50 20 C30 20, 25 35, 25 45 C25 55, 30 60, 40 60 L60 60 C70 60, 75 55, 75 45 C75 35, 70 20, 50 20 Z"
          fill="hsl(var(--primary))"
        />
        {/* Chef Hat Band */}
        <rect x="30" y="60" width="40" height="15" rx="3" fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
};

export default NibbleNowLogo;
