
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow logo mark">
      <svg
        className="h-10 w-10" /* Increased size, removed mr-2 */
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="100" height="100" rx="15" fill="hsl(var(--card))" /> {/* Background for the icon */}
        {/* Abstract 'N' with a "nibble" or dynamic element */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20 80V20H35L60 55V20H75V80H60L35 45V80H20ZM68 80C72.4183 80 76 76.4183 76 72C76 67.5817 72.4183 64 68 64C63.5817 64 60 67.5817 60 72C60 76.4183 63.5817 80 68 80Z"
          fill="hsl(var(--primary))" /* Color for the 'N' and circle */
        />
      </svg>
      {/* Text name removed */}
    </div>
  );
};

export default NibbleNowLogo;
