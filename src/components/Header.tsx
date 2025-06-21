
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle, Bell, MapPin, ChevronDown, Loader2 } from 'lucide-react';
import RasoiExpressLogo from './icons/NibbleNowLogo';
import { Button } from './ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import HelpDialog from './HelpDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GeocodedLocation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


interface AppNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  type: 'new_dish' | 'order_update' | 'offer' | 'general';
  link?: string;
  restaurantId?: string;
  orderId?: string;
}

const Header = () => {
  const { getCartItemCount, setIsCartOpen } = useCart();
  const { isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const itemCount = getCartItemCount();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Location State
  const [currentLocation, setCurrentLocation] = useState<GeocodedLocation | null>(null);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [pinCodeInput, setPinCodeInput] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const initialNotifications: AppNotification[] = [
    { id: 1, title: "New Dish Alert at Pizza Palace!", message: "Try our new 'Spicy Dragon Noodles'. Limited time only!", read: false, type: 'new_dish', restaurantId: 'r1' },
    { id: 2, title: "Order #ORD12345 Delivered", message: "Your recent order has been successfully delivered. Enjoy!", read: true, type: 'order_update', orderId: 'ORD12345', link: '/profile' },
    { id: 3, title: "Weekend Special: 20% Off!", message: "Get 20% off on all burgers at Burger Barn this weekend!", read: false, type: 'offer', restaurantId: 'r2' },
    { id: 4, title: "Welcome to Rasoi Express!", message: "Explore thousands of restaurants and dishes.", read: true, type: 'general' },
  ];

  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  useEffect(() => {
    // Load location from localStorage
    const savedLocationString = localStorage.getItem('rasoiExpressUserLocation');
    if (savedLocationString) {
      try {
        const parsedValue = JSON.parse(savedLocationString);
        if (typeof parsedValue === 'object' && parsedValue !== null && (parsedValue.city || parsedValue.locality || parsedValue.error)) {
          setCurrentLocation(parsedValue as GeocodedLocation);
        } else {
          console.warn(`Invalid location format in localStorage: "${savedLocationString}". Expected an object with city, locality, or error. Removing item.`);
          localStorage.removeItem('rasoiExpressUserLocation');
        }
      } catch (error) { 
        console.error(`Failed to parse location from localStorage (malformed JSON: "${savedLocationString}"):`, error);
        localStorage.removeItem('rasoiExpressUserLocation'); 
      }
    }
  }, []);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notificationId: number) => {
    const clickedNotification = notifications.find(n => n.id === notificationId);
    if (!clickedNotification) return;

    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    if (clickedNotification.link) {
      router.push(clickedNotification.link);
    } else if (clickedNotification.type === 'new_dish' && clickedNotification.restaurantId) {
      router.push(`/restaurants/${clickedNotification.restaurantId}`);
    } else if (clickedNotification.type === 'offer' && clickedNotification.restaurantId) {
      router.push(`/restaurants/${clickedNotification.restaurantId}`);
    } else if (clickedNotification.type === 'order_update' && clickedNotification.orderId) {
      router.push('/profile');
    }
    // setIsNotificationPanelOpen(false); // Optionally close popover
  };

  const handleConfirmLocation = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinCodeInput.trim())) {
      toast({
        title: "Invalid Pin Code",
        description: "Please enter a valid 6-digit pin code.",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingLocation(true);
    setCurrentLocation(null); 

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode: pinCodeInput.trim() }),
      });

      const data: GeocodedLocation = await response.json();

      if (!response.ok || data.error) {
        toast({
          title: "Location Error",
          description: data.error || "Could not fetch location data for this pin code.",
          variant: "destructive",
        });
        setCurrentLocation({ error: data.error || "Could not fetch location." }); 
      } else {
        setCurrentLocation(data);
        localStorage.setItem('rasoiExpressUserLocation', JSON.stringify(data));
        setIsLocationPopoverOpen(false);
        setPinCodeInput('');
         toast({
          title: "Location Set!",
          description: `Serving ${data.locality || data.city || 'your area'}.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to location service. Please try again.",
        variant: "destructive",
      });
      setCurrentLocation({ error: "Network error fetching location." });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const displayLocation = currentLocation?.locality || currentLocation?.city || "Set Location";
  const displayPin = currentLocation?.fullAddress?.match(/\b\d{6}\b/)?.[0] || (currentLocation?.error ? "Error" : "Select Area");


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-sidebar-border bg-sidebar-background/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar-background/70">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" aria-label="Rasoi Express Home">
              <RasoiExpressLogo />
            </Link>
            
            <Popover open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="px-2 py-1 h-auto text-xs sm:text-sm text-muted-foreground hover:text-primary">
                  <MapPin className="h-4 w-4 sm:mr-1 text-primary" />
                  <div className="flex flex-col items-start">
                     <span className="font-semibold text-primary hidden sm:inline leading-tight max-w-[100px] truncate" title={displayLocation}>
                       {isFetchingLocation ? "Fetching..." : displayLocation}
                     </span>
                     <span className="text-xs text-muted-foreground hidden sm:inline leading-tight max-w-[100px] truncate">
                       {isFetchingLocation ? "" : displayPin}
                     </span>
                     <span className="sm:hidden text-primary">{isFetchingLocation ? "Fetching..." : (currentLocation?.locality || currentLocation?.city || "Location")}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 sm:ml-1 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <form onSubmit={handleConfirmLocation}>
                  <div className="space-y-3">
                    <Label htmlFor="pinCode" className="font-medium">Enter Delivery Pin Code</Label>
                    <Input
                      id="pinCode"
                      type="text"
                      placeholder="e.g., 110001"
                      value={pinCodeInput}
                      onChange={(e) => setPinCodeInput(e.target.value)}
                      maxLength={6}
                      className="text-sm"
                      disabled={isFetchingLocation}
                    />
                    <Button type="submit" size="sm" className="w-full bg-primary hover:bg-primary/90" disabled={isFetchingLocation}>
                      {isFetchingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isFetchingLocation ? "Confirming..." : "Confirm Location"}
                    </Button>
                  </div>
                </form>
                 {currentLocation?.error && !isFetchingLocation && (
                    <p className="mt-2 text-xs text-destructive">{currentLocation.error}</p>
                )}
              </PopoverContent>
            </Popover>
          </div>

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
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
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
                        onClick={() => handleNotificationClick(notification.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification.id)}
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
                  <Button variant="link" size="sm" className="text-primary" onClick={() => {/* Implement view all or clear */}}>
                    View all notifications
                  </Button>
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
    
