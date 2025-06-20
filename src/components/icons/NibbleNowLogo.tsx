
import type { FC } from 'react';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow Logo">
      <svg
        className="mr-2 h-7 w-7 text-primary"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Simple 'N' letterform logo */}
        <path d="M7.107,20.016 L7.107,3.984 L9.524,3.984 L14.711,13.065 L14.711,3.984 L16.893,3.984 L16.893,20.016 L14.476,20.016 L9.289,10.935 L9.289,20.016 L7.107,20.016 Z"/>
      </svg>
      <span className="font-headline text-3xl font-bold">
        <span className="text-primary">Nibble</span>
        <span className="text-accent">Now</span>
      </span>
    </div>
  );
};

export default NibbleNowLogo;
