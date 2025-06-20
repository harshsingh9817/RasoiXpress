
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle, Bell } from 'lucide-react';
import NibbleNowLogo from './icons/NibbleNowLogo';
import { Button } from './ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import HelpDialog from './HelpDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Added Popover

const Header = () => {
  const { getCartItemCount, setIsCartOpen } = useCart();
  const { isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
  const itemCount = getCartItemCount();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false); // State for notification panel

  // Mock notifications - replace with actual data later
  const notifications = [
    { id: 1, title: "New Dish Alert!", message: "Try our new 'Spicy Dragon Noodles' at Pizza Palace.", read: false },
    { id: 2, title: "Order Update", message: "Your order #ORD12345 has been delivered.", read: true },
    { id: 3, title: "Special Offer", message: "Get 20% off on all burgers today at Burger Barn!", read: false },
  ];
  const unreadNotificationCount = notifications.filter(n => !n.read).length;


  return (
    <>
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

            <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3" onClick={() => setIsHelpDialogOpen(true)}>
              <HelpCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Help</span>
            </Button>

            {isAuthLoading ? (
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            ) : (
              <>
                {isAuthenticated && (
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
                )}
                {!isAuthenticated && (
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

            <Popover open={isNotificationPanelOpen} onOpenChange={setIsNotificationPanelOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative rounded-full"
                  aria-label={`Open notifications with ${unreadNotificationCount} unread`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs"
                      aria-label={`${unreadNotificationCount} unread notifications`}
                    >
                      {unreadNotificationCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 font-medium border-b">Notifications</div>
                {notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                      >
                        <p className={`font-semibold text-sm ${!notification.read ? 'text-primary' : ''}`}>{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 text-sm text-muted-foreground text-center">No new notifications.</p>
                )}
                <div className="p-2 border-t text-center">
                  <Button variant="link" size="sm" className="text-primary">View all notifications</Button>
                </div>
              </PopoverContent>
            </Popover>

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
      <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
    </>
  );
};

export default Header;
