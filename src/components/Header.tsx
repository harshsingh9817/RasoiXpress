
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle, Bell, Loader2 } from 'lucide-react';
import RasoiXpressLogo from '@/components/icons/RasoiXpressLogo';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import HelpDialog from './HelpDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AppNotification, Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAllOrders } from '@/lib/data';

const orderStatusNotificationMap: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  'Order Placed': {
    title: 'Payment Successful!',
    message: 'Your order has been placed. The restaurant will confirm it shortly.',
  },
  'Confirmed': {
    title: 'Order Confirmed',
    message: 'The restaurant is preparing your order.',
  },
  'Preparing': {
    title: 'Order in the Kitchen',
    message: 'Your meal is being freshly prepared by the chefs!',
  },
  'Shipped': {
    title: 'Order Shipped',
    message: 'Your order has been dispatched from the restaurant.',
  },
  'Out for Delivery': {
    title: 'Out for Delivery',
    message: 'Your delivery partner is on the way to your location!',
  },
  'Delivered': {
    title: 'Order Delivered!',
    message: 'We hope you enjoy your meal! You can now leave a review.',
  },
  'Cancelled': {
    title: 'Order Cancelled',
    message: 'Your order has been successfully cancelled.',
  },
};

const Header = () => {
  const { user, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  
  // Notification State
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const syncNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
        setNotifications([]);
        setIsLoadingNotifications(false);
        return;
    }
    setIsLoadingNotifications(true);

    const allOrders = getAllOrders();
    const userOrders = allOrders.filter(o => o.userId === user.uid);

    const existingNotifications: AppNotification[] = JSON.parse(localStorage.getItem('rasoiExpressUserNotifications') || '[]');
    
    const generatedNotifications: AppNotification[] = [];

    // 1. Process Order Statuses to generate notifications
    userOrders.forEach(order => {
        const notificationId = `notif-${order.id}-${order.status}`;
        const hasNotif = existingNotifications.some(n => n.id === notificationId) || generatedNotifications.some(n => n.id === notificationId);

        if (!hasNotif && orderStatusNotificationMap[order.status]) {
            const details = orderStatusNotificationMap[order.status]!;
            generatedNotifications.push({
                id: notificationId,
                timestamp: new Date(order.date).getTime() + Math.random(),
                title: `${details.title} (#${order.id.slice(-5)})`,
                message: details.message,
                read: false,
                type: 'order_update',
                orderId: order.id,
                link: '/profile',
            });
        }
    });

    // 2. Fetch AI Recommendations (remains unchanged)
    let aiNotifications: AppNotification[] = [];
    try {
        const response = await fetch('/api/recommend', { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            if (data?.recommendations) {
                aiNotifications = data.recommendations.map((rec: any, index: number) => ({
                    id: `notif-rec-${rec.restaurantId}-${rec.dishName.replace(/\s/g, '')}`,
                    timestamp: Date.now() - (index * 1000),
                    title: `✨ You might love ${rec.dishName}!`,
                    message: rec.reason,
                    read: false,
                    type: 'new_dish' as const,
                    link: `/`,
                }));
            }
        }
    } catch (error) {
        console.warn("AI recommendation fetch failed, continuing without them.");
    }

    // 3. Combine, deduplicate, and save
    const allNotifications = [
        ...existingNotifications,
        ...generatedNotifications,
        ...aiNotifications,
    ];
    
    const uniqueNotifications = Array.from(new Map(allNotifications.map(n => [n.id, n])).values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 25); 

    setNotifications(uniqueNotifications);
    localStorage.setItem('rasoiExpressUserNotifications', JSON.stringify(uniqueNotifications));

    setIsLoadingNotifications(false);
  }, [isAuthenticated, user]);


  useEffect(() => {
    if (!isClient) return;
    syncNotifications();
  }, [isClient, pathname, syncNotifications]);


  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notificationId: string) => {
    const clickedNotification = notifications.find(n => n.id === notificationId);
    if (!clickedNotification) return;

    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('rasoiExpressUserNotifications', JSON.stringify(updatedNotifications));


    if (clickedNotification.link) {
      router.push(clickedNotification.link);
    }
    setIsNotificationPanelOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-sidebar-border bg-sidebar-background/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar-background/70">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" aria-label="Rasoi Xpress Home">
              <RasoiXpressLogo />
            </Link>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            <Link href="/">
              <Button variant="ghost" className="text-sm font-medium px-2 sm:px-3">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Menu</span>
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

            {isAuthenticated && (
              <Popover open={isNotificationPanelOpen} onOpenChange={setIsNotificationPanelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-full"
                    aria-label={`Open notifications with ${unreadNotificationCount} unread`}
                  >
                    <Bell className="h-5 w-5" />
                    {isClient && (
                      <>
                        {isLoadingNotifications ? (
                          <Loader2 className="absolute -right-1 -top-1 h-4 w-4 animate-spin text-primary" />
                        ) : (
                          unreadNotificationCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs"
                              aria-label={`${unreadNotificationCount} unread notifications`}
                            >
                              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </Badge>
                          )
                        )}
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 font-medium border-b">Notifications</div>
                  {isLoadingNotifications ? (
                     <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                     </div>
                  ) : notifications.filter(n => !n.read).length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.filter(n => !n.read).map(notification => (
                        <div
                          key={notification.id}
                          className="p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer bg-primary/5"
                          onClick={() => handleNotificationClick(notification.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification.id)}
                        >
                          <p className="font-semibold text-sm text-primary">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground text-center">No new notifications.</p>
                  )}
                   <div className="p-2 border-t text-center">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary"
                      onClick={() => {
                        const allRead = notifications.map(n => ({ ...n, read: true }));
                        setNotifications(allRead);
                        localStorage.setItem('rasoiExpressUserNotifications', JSON.stringify(allRead));
                      }}
                    >
                      Mark all as read
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </nav>
        </div>
      </header>
      <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
    </>
  );
};

export default Header;
