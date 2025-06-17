
"use client";

import Link from 'next/link';
import { ShoppingCart, Home, Sparkles, User } from 'lucide-react'; // Added User icon
import NibbleNowLogo from './icons/NibbleNowLogo';
import { Button } from './ui/button';
import { useCart } from '@/contexts/CartContext';
import { Badge } from './ui/badge';

const Header = () => {
  const { getCartItemCount, setIsCartOpen } = useCart();
  const itemCount = getCartItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="NibbleNow Home">
          <NibbleNowLogo />
        </Link>
        <nav className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
          <Link href="/">
            <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3">
              <Home className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Restaurants</span>
            </Button>
          </Link>
          <Link href="/recommendations">
            <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3">
              <Sparkles className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Recommendations</span>
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-full"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open cart with ${itemCount} items`}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs"
                aria-label={`${itemCount} items in cart`}
              >
                {itemCount}
              </Badge>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
