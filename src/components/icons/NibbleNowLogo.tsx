
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow logo mark">
      <svg
        className="h-10 w-10"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="100" height="100" rx="15" fill="hsl(var(--card))" />
        <path
          d="M20 15 H38 V85 H20 Z M38 15 L62 85 L73 85 L49 15 Z M62 15 H80 V85 H62 Z"
          fill="hsl(var(--primary))"
        />
        {/* Bite mark - circle filled with the card background color to appear as a cutout */}
        <circle cx="75" cy="25" r="10" fill="hsl(var(--card))" />
      </svg>
    </div>
  );
};

export default NibbleNowLogo;
