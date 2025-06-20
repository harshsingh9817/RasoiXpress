
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow Logo">
      <svg
        className="mr-2 h-8 w-8 text-primary" // Slightly increased size for better visibility
        viewBox="0 0 100 100"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Abstract 'N' with a "nibble" or dynamic element */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20 80V20H35L60 55V20H75V80H60L35 45V80H20ZM68 80C72.4183 80 76 76.4183 76 72C76 67.5817 72.4183 64 68 64C63.5817 64 60 67.5817 60 72C60 76.4183 63.5817 80 68 80Z"
        />
        {/* Optional: Add a small accent element if desired, e.g. a small circle or swoosh */}
        {/* <circle cx="80" cy="25" r="5" className="text-accent" /> */}
      </svg>
      <span className="font-headline text-3xl font-bold">
        <span className="text-primary">Nibble</span>
        <span className="text-accent">Now</span>
      </span>
    </div>
  );
};

export default NibbleNowLogo;
