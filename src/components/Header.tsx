
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle, Bell, Loader2,
  Package, MessageSquare, Sparkles, PackagePlus, ClipboardCheck, ChefHat, Truck, Bike, PackageCheck as DeliveredIcon, XCircle,
} from 'lucide-react';
import RasoiXpressLogo from '@/components/icons/RasoiXpressLogo';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import HelpDialog from './HelpDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { AppNotification, Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAllOrders, getAdminMessages, getUserAdminMessages, getUserOrders } from '@/lib/data';

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

const getNotificationIcon = (notification: AppNotification) => {
    const iconClass = `h-5 w-5 flex-shrink-0 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`;

    switch (notification.type) {
        case 'admin_new_order':
            return <Package className={iconClass} />;
        case 'admin_order_delivered':
            return <DeliveredIcon className={iconClass} />;
        case 'admin_message':
            return <MessageSquare className={iconClass} />;
        case 'new_dish':
            return <Sparkles className={iconClass} />;
        case 'delivery_assignment':
            return <Bike className={iconClass} />;
        case 'order_update':
            if (notification.orderStatus) {
                switch (notification.orderStatus) {
                    case 'Order Placed': return <PackagePlus className={iconClass} />;
                    case 'Confirmed': return <ClipboardCheck className={iconClass} />;
                    case 'Preparing': return <ChefHat className={iconClass} />;
                    case 'Shipped': return <Truck className={iconClass} />;
                    case 'Out for Delivery': return <Bike className={iconClass} />;
                    case 'Delivered': return <DeliveredIcon className={iconClass} />;
                    case 'Cancelled': return <XCircle className={iconClass} />;
                    default: break;
                }
            }
            return <Bell className={iconClass} />;
        default:
            return <Bell className={iconClass} />;
    }
}


const Header = () => {
  const { user, isAuthenticated, isAdmin, isDelivery, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  
  // Notification State
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<AppNotification | null>(null);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showSystemNotification = (title: string, options: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  };

  const syncNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
        setNotifications([]);
        setIsLoadingNotifications(false);
        return;
    }
    setIsLoadingNotifications(true);

    const storageKey = isAdmin 
        ? 'rasoiExpressAdminNotifications' 
        : isDelivery 
        ? 'rasoiExpressDeliveryNotifications' 
        : 'rasoiExpressUserNotifications';
    
    const existingNotifications: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const generatedNotifications: AppNotification[] = [];

    if (isAdmin) {
        // --- ADMIN NOTIFICATION LOGIC ---
        const allOrders = await getAllOrders();
        allOrders.forEach(order => {
            // 1. New Order Notification
            if (order.status === 'Order Placed') {
                const notificationId = `notif-admin-new-order-${order.id}`;
                const hasNotif = existingNotifications.some(n => n.id === notificationId) || generatedNotifications.some(n => n.id === notificationId);
                if (!hasNotif) {
                    generatedNotifications.push({
                        id: notificationId,
                        timestamp: new Date(order.date).getTime(),
                        title: `New Order Placed!`,
                        message: `Order #${order.id.slice(-6)} from ${order.customerName} for Rs.${order.total.toFixed(2)}.`,
                        read: false,
                        type: 'admin_new_order',
                        orderId: order.id,
                        orderStatus: order.status,
                        link: '/admin/orders',
                    });
                }
            }

            // 2. Order Delivered Notification
            if (order.status === 'Delivered') {
                const notificationId = `notif-admin-delivered-${order.id}`;
                const hasNotif = existingNotifications.some(n => n.id === notificationId) || generatedNotifications.some(n => n.id === notificationId);
                if (!hasNotif) {
                     generatedNotifications.push({
                        id: notificationId,
                        timestamp: new Date(order.date).getTime() + 1,
                        title: `Order Delivered`,
                        message: `Order #${order.id.slice(-6)} to ${order.customerName} has been completed.`,
                        read: false,
                        type: 'admin_order_delivered',
                        orderId: order.id,
                        orderStatus: order.status,
                        link: '/admin/orders',
                    });
                }
            }
        });
    } else if (isDelivery) {
        // --- DELIVERY NOTIFICATION LOGIC ---
        const allOrders = await getAllOrders();
        allOrders.forEach(order => {
            if (order.status === 'Out for Delivery') {
                const notificationId = `notif-delivery-assign-${order.id}`;
                const hasNotif = existingNotifications.some(n => n.id === notificationId) || generatedNotifications.some(n => n.id === notificationId);
                if (!hasNotif) {
                    generatedNotifications.push({
                        id: notificationId,
                        timestamp: new Date(order.date).getTime() + Math.random(),
                        title: `New Delivery: #${order.id.slice(-6)}`,
                        message: `Order for ${order.customerName} is now out for delivery.`,
                        read: false,
                        type: 'delivery_assignment',
                        orderId: order.id,
                        orderStatus: order.status,
                        link: '/delivery/dashboard',
                    });
                }
            }
        });
    } else {
        // --- REGULAR USER NOTIFICATION LOGIC ---
        const userOrders = await getUserOrders(user.uid);
        
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
                    orderStatus: order.status,
                    link: '/profile',
                });
            }
        });
        
        const adminMessages = await getUserAdminMessages(user.uid);
        adminMessages.forEach(msg => {
          const notificationId = `notif-${msg.id}`;
          const hasNotif = existingNotifications.some(n => n.id === notificationId) || generatedNotifications.some(n => n.id === notificationId);
          if (!hasNotif) {
            generatedNotifications.push({
              id: notificationId,
              timestamp: msg.timestamp,
              title: msg.title,
              message: msg.message,
              read: false,
              type: 'admin_message',
            });
          }
        });

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
        generatedNotifications.push(...aiNotifications);
    }
    
    generatedNotifications.forEach(n => {
      if (
        (isAdmin && (n.type === 'admin_new_order' || n.type === 'admin_order_delivered')) ||
        (!isAdmin && !isDelivery && (n.type === 'order_update' || n.type === 'admin_message')) ||
        (isDelivery && n.type === 'delivery_assignment')
      ) {
        showSystemNotification(n.title, { body: n.message, tag: n.id });
      }
    });

    const allNotifications = [...existingNotifications, ...generatedNotifications];
    const uniqueNotifications = Array.from(new Map(allNotifications.map(n => [n.id, n])).values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);

    setNotifications(uniqueNotifications);
    localStorage.setItem(storageKey, JSON.stringify(uniqueNotifications));
    setIsLoadingNotifications(false);
  }, [isAuthenticated, user, isAdmin, isDelivery]);


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
    
    const storageKey = isAdmin 
        ? 'rasoiExpressAdminNotifications' 
        : isDelivery 
        ? 'rasoiExpressDeliveryNotifications' 
        : 'rasoiExpressUserNotifications';
    localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));

    if (clickedNotification.type === 'admin_message') {
        setViewingMessage(clickedNotification);
    } else if (clickedNotification.link) {
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
            <div className="hidden md:flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
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
            </div>

            {isAuthenticated && (
              <Popover open={isNotificationPanelOpen} onOpenChange={setIsNotificationPanelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-full"
                    aria-label={`Open notifications with ${unreadNotificationCount} unread`}
                  >
                    <Bell className="h-5 w-5 text-accent" />
                    {isClient && (
                      <>
                        {isLoadingNotifications ? (
                          <Loader2 className="absolute -right-1 -top-1 h-4 w-4 animate-spin text-primary" />
                        ) : (
                          unreadNotificationCount > 0 && (
                            <Badge
                              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs bg-primary text-primary-foreground border-2 border-background"
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
                <PopoverContent className="w-96 p-0 bg-secondary" align="end">
                  <div className="p-4 font-medium border-b">Notifications</div>
                  {isLoadingNotifications ? (
                     <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                     </div>
                  ) : notifications.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`flex items-start p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                          onClick={() => handleNotificationClick(notification.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification.id)}
                        >
                          <div className="flex-shrink-0 mr-3 mt-1">
                            {getNotificationIcon(notification)}
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${!notification.read ? 'text-primary' : ''}`}>{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message.length > 50 ? `${notification.message.substring(0, 50)}...` : notification.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground text-center">No notifications found.</p>
                  )}
                   <div className="p-2 border-t text-center">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary"
                      onClick={() => {
                        const storageKey = isAdmin 
                            ? 'rasoiExpressAdminNotifications' 
                            : isDelivery 
                            ? 'rasoiExpressDeliveryNotifications' 
                            : 'rasoiExpressUserNotifications';
                        const allRead = notifications.map(n => ({ ...n, read: true }));
                        setNotifications(allRead);
                        localStorage.setItem(storageKey, JSON.stringify(allRead));
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

      <Dialog open={!!viewingMessage} onOpenChange={(isOpen) => !isOpen && setViewingMessage(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{viewingMessage?.title}</DialogTitle>
                <DialogDescription>A message from the admin team.</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-foreground whitespace-pre-wrap">
                {viewingMessage?.message}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
