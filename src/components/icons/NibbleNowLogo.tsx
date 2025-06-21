
import type { FC } from 'react';

const RasoiExpressLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="Rasoi Express logo - a plate with a fork and spoon, and the name Rasoi Express">
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
        aria-hidden="true"
      >
        {/* Outer plate rim */}
        <circle cx="50" cy="50" r="48" fill="hsl(var(--accent))" />
        {/* Inner plate surface */}
        <circle cx="50" cy="50" r="40" fill="hsl(var(--primary))" />

        {/* Fork (on the left) */}
        {/* Fork Handle */}
        <rect x="30" y="35" width="8" height="35" rx="3" fill="hsl(var(--foreground))" />
        {/* Fork Head (base part connecting to tines) */}
        <rect x="26" y="28" width="16" height="10" rx="2" fill="hsl(var(--foreground))" />
        {/* Fork Tines (3 tines) */}
        <rect x="28" y="18" width="4" height="12" fill="hsl(var(--foreground))" />
        <rect x="34" y="18" width="4" height="12" fill="hsl(var(--foreground))" />
        <rect x="40" y="18" width="4" height="12" fill="hsl(var(--foreground))" />

        {/* Spoon (on the right) */}
        {/* Spoon Bowl */}
        <ellipse cx="66" cy="28" rx="10" ry="13" fill="hsl(var(--foreground))" />
        {/* Spoon Handle */}
        <rect x="62" y="38" width="8" height="32" rx="3" fill="hsl(var(--foreground))" />

        {/* Detail Lines at the bottom (curved) */}
        <path d="M38 78 Q50 81 62 78" stroke="hsl(var(--foreground))" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M42 84 Q50 87 58 84" stroke="hsl(var(--foreground))" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
      <span className="text-2xl font-bold text-primary font-headline">
        Rasoi Express
      </span>
    </div>
  );
};

export default RasoiExpressLogo;
