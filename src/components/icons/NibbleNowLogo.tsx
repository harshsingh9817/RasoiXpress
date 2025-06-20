
import type { FC } from 'react';
import Image from 'next/image';

const NibbleNowLogo: FC = () => {
  return (
    <div className="flex items-center" aria-label="NibbleNow logo - a plate with a spoon and fork, and the name NibbleNow">
      <Image
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_X-YJdD4b9zYw2T1p0F9j2W6K8w3Y7n9tQ&s"
        alt="NibbleNow plate and cutlery logo"
        width={40}
        height={40}
        className="mr-2"
        priority // Add priority if this is a critical LCP element
      />
      <span className="text-2xl font-bold text-primary font-headline">
        NibbleNow
      </span>
    </div>
  );
};

export default NibbleNowLogo;
