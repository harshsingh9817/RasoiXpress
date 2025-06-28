
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle, Bell, Loader2, ListOrdered,
  Package, MessageSquare, PackagePlus, ClipboardCheck, ChefHat, Bike, PackageCheck as DeliveredIcon, XCircle,
} from 'lucide-react';
import RasoiXpressLogo from '@/components/icons/RasoiXpressLogo';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import HelpDialog from './HelpDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AppNotification, Order, OrderStatus, AdminMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { listenToAllOrders, listenToUserAdminMessages, listenToUserOrders } from '@/lib/data';

const orderStatusNotificationMap: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  'Order Placed': { title: 'Payment Successful!', message: 'Your order has been placed. The restaurant will confirm it shortly.' },
  'Confirmed': { title: 'Order Confirmed', message: 'The restaurant is preparing your order.' },
  'Preparing': { title: 'Order in the Kitchen', message: 'Your meal is being freshly prepared by the chefs!' },
  'Out for Delivery': { title: 'Out for Delivery', message: 'Your delivery partner is on the way to your location!' },
  'Delivered': { title: 'Order Delivered!', message: 'We hope you enjoy your meal! You can now leave a review.' },
  'Cancelled': { title: 'Order Cancelled', message: 'Your order has been successfully cancelled.' },
};

const Header = () => {
  const { user, isAuthenticated, isAdmin, isDelivery, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const [isClient, setIsClient] = useState(false);
  const isInitialLoad = useRef(true);

  useEffect(() => { setIsClient(true); }, []);

  const showSystemNotification = (title: string, options: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options));
    }
  };

  useEffect(() => {
    if (!isClient || !isAuthenticated || isAuthLoading || !user) {
      isInitialLoad.current = true; // Reset for next login
      setIsLoadingNotifications(false);
      return;
    }

    setIsLoadingNotifications(true);

    const storageKey = isAdmin 
        ? 'rasoiExpressAdminNotifications' 
        : isDelivery 
        ? 'rasoiExpressDeliveryNotifications' 
        : `rasoiExpressUserNotifications_${user.uid}`;
    
    const syncNotificationsFromStorage = () => {
        const storedNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setNotifications(storedNotifications);
    };
    
    window.addEventListener('notificationsUpdated', syncNotificationsFromStorage);
    
    const processNotifications = (newItems: (Order | AdminMessage)[], type: 'order' | 'message' | 'admin_order' | 'delivery_order') => {
        const existingNotifications: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const generatedNotifications: AppNotification[] = [];
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

        newItems.forEach(item => {
            let id: string, notif: AppNotification | null = null;
            const now = Date.now();

            if (type === 'admin_order' && 'status' in item) {
                const order = item as Order;
                if (order.status === 'Order Placed') {
                    id = `notif-admin-new-order-${order.id}`;
                    if (!existingNotifications.some(n => n.id === id)) {
                       notif = { id, timestamp: now, title: `New Order!`, message: `Order #${order.id.slice(-6)} from ${order.customerName}.`, read: false, type: 'admin_new_order', orderId: order.id, link: '/admin/orders' };
                    }
                }
                if (order.status === 'Delivered') {
                    id = `notif-admin-order-delivered-${order.id}`;
                    if (!existingNotifications.some(n => n.id === id)) {
                       notif = { id, timestamp: now, title: `Order Delivered`, message: `Order #${order.id.slice(-6)} for ${order.customerName} has been delivered.`, read: false, type: 'admin_order_delivered', orderId: order.id, link: '/admin/orders' };
                    }
                }
            } else if (type === 'delivery_order' && 'status' in item && item.status === 'Confirmed' && !(item as Order).deliveryRiderId) {
                const order = item as Order;
                id = `notif-delivery-new-order-${order.id}`;
                if (!existingNotifications.some(n => n.id === id)) {
                   notif = { id, timestamp: now, title: `New Delivery Available!`, message: `Order #${order.id.slice(-6)} is ready for pickup.`, read: false, type: 'delivery_available', orderId: order.id, link: `/delivery/orders/${order.id}` };
                }
            } else if (type === 'order' && 'status' in item) {
                const order = item as Order;
                id = `notif-user-${order.id}-${order.status}`;
                if (!existingNotifications.some(n => n.id === id) && orderStatusNotificationMap[order.status]) {
                    const details = orderStatusNotificationMap[order.status]!;
                    notif = { id, timestamp: now, title: `${details.title}`, message: details.message, read: false, type: 'order_update', orderId: order.id, orderStatus: order.status, link: `/my-orders?track=${order.id}` };
                }
            } else if (type === 'message' && 'title' in item) {
                const msg = item as AdminMessage;
                id = `notif-message-${msg.id}`;
                if (!existingNotifications.some(n => n.id === id)) {
                    notif = { id, timestamp: msg.timestamp, title: msg.title, message: msg.message, read: false, type: 'admin_message' };
                }
            }

            if (notif) {
                // We found a new event that has never had a notification. Add it to our list to be saved.
                generatedNotifications.push(notif);

                // Now, decide if we should show a pop-up system notification for it.
                // We don't show pop-ups for very old events on the very first app load.
                const shouldShowSystemAlert = !(isInitialLoad.current && notif.timestamp < twentyFourHoursAgo);
                
                if (shouldShowSystemAlert) {
                    showSystemNotification(notif.title, { body: notif.message, tag: notif.id });
                }
            }
        });

        // After the first processing batch, subsequent runs are real-time updates.
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
        }

        if (generatedNotifications.length > 0) {
            const all = [...generatedNotifications, ...existingNotifications].sort((a,b) => b.timestamp - a.timestamp).slice(0, 50);
            localStorage.setItem(storageKey, JSON.stringify(all));
            setNotifications(all);
            window.dispatchEvent(new Event('notificationsUpdated'));
        }
    };

    const unsubscribers: (()=>void)[] = [];

    if (isAdmin) {
        unsubscribers.push(listenToAllOrders(orders => processNotifications(orders, 'admin_order')));
    } else if (isDelivery) {
        unsubscribers.push(listenToAllOrders(orders => processNotifications(orders, 'delivery_order')));
    } else {
        unsubscribers.push(listenToUserOrders(user.uid, orders => processNotifications(orders, 'order')));
        unsubscribers.push(listenToUserAdminMessages(user.uid, messages => processNotifications(messages, 'message')));
    }
    
    syncNotificationsFromStorage();
    setIsLoadingNotifications(false);

    return () => {
        unsubscribers.forEach(unsub => unsub());
        window.removeEventListener('notificationsUpdated', syncNotificationsFromStorage);
    };

}, [isClient, isAuthenticated, user, isAdmin, isDelivery, isAuthLoading]);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  if (isAuthLoading) return (
    <header className="sticky top-0 z-50 w-full border-b bg-sidebar-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
    </header>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-sidebar-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href={isDelivery ? '/delivery/dashboard' : '/'} aria-label="Home"><RasoiXpressLogo /></Link>
          
          <nav className="hidden md:flex items-center space-x-2">
            {!isDelivery && <Link href="/"><Button variant="ghost"><Home className="mr-2 h-4 w-4" />Menu</Button></Link>}
            {!isDelivery && !isAdmin && <Link href="/my-orders"><Button variant="ghost"><ListOrdered className="mr-2 h-4 w-4" />My Orders</Button></Link>}
            <Button variant="ghost" onClick={() => setIsHelpDialogOpen(true)}><HelpCircle className="mr-2 h-4 w-4" />Help</Button>
            {isDelivery && <Link href="/delivery/dashboard"><Button variant="ghost"><Bike className="mr-2 h-4 w-4" />Rider Panel</Button></Link>}
            {isAdmin && <Link href="/admin"><Button variant="ghost" className="text-red-600"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Button></Link>}
            
            {isAuthenticated ? (
                <Link href={isDelivery ? "/delivery/profile" : "/profile"}><Button variant="ghost"><User className="mr-2 h-4 w-4" />Profile</Button></Link>
            ) : (
                <Link href="/login"><Button variant="ghost"><LogIn className="mr-2 h-4 w-4"/>Login</Button></Link>
            )}
            
            {isAuthenticated && (
                <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-6 w-6" />
                    {isClient && unreadNotificationCount > 0 && <Badge variant="destructive" className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</Badge>}
                </Button>
                </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && (
                <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-6 w-6" />
                    {isClient && unreadNotificationCount > 0 && (
                    <Badge variant="destructive" className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</Badge>
                    )}
                </Button>
                </Link>
            )}
          </div>
        </div>
      </header>
      <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
    </>
  );
};

export default Header;
