
"use client";

import Link from 'next/link';
import { ShoppingCart, Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle } from 'lucide-react'; // Added HelpCircle
import NibbleNowLogo from './icons/NibbleNowLogo';
import { Button } from './ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

const Header = () => {
  const { getCartItemCount, setIsCartOpen } = useCart();
  const { isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
  const itemCount = getCartItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="NibbleNow Home">
          <NibbleNowLogo />
        </Link>
        <nav className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          <Link href="/">
            <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3">
              <Home className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Restaurants</span>
            </Button>
          </Link>

          {/* Help Button - Added */}
          <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3" onClick={() => alert('Help page coming soon!')}>
            <HelpCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Help</span>
          </Button>

          {isAuthLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ) : (
            <>
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3 text-red-600 hover:text-red-700">
                        <ShieldCheck className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Admin</span>
                      </Button>
                    </Link>
                  )}
                  <Link href="/profile">
                    <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3">
                      <User className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Profile</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3">
                      <LogIn className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Login</span>
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="default" className="text-sm font-medium px-2 sm:px-3 bg-accent hover:bg-accent/90 text-accent-foreground">
                      <UserPlus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Sign Up</span>
                    </Button>
                  </Link>
                </>
              )}
            </>
          )}

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
