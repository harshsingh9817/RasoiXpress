
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle, Bell, ListOrdered,
  Package, MessageSquare, PackagePlus, ClipboardCheck, ChefHat, Bike, PackageCheck as DeliveredIcon, XCircle, LifeBuoy, LayoutGrid,
} from 'lucide-react';
import RasoiXpressLogo from '@/components/icons/RasoiXpressLogo';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import HelpDialog from './HelpDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AppNotification, Order, OrderStatus, AdminMessage, SupportTicket } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { listenToAllOrders, listenToUserAdminMessages, listenToUserOrders, listenToSupportTickets } from '@/lib/data';

const orderStatusNotificationMap: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  'Order Placed': { title: 'Payment Successful!', message: 'Your order has been placed. The restaurant will confirm it shortly.' },
  'Confirmed': { title: 'Order Confirmed', message: 'The restaurant is preparing your order.' },
  'Preparing': { title: 'Order in the Kitchen', message: 'Your meal is being freshly prepared by the chefs!' },
  'Out for Delivery': { title: 'Out for Delivery', message: 'Your delivery partner is on the way to your location!' },
  'Delivered': { title: 'Order Delivered!', message: 'We hope you enjoy your meal! You can now leave a review.' },
  'Cancelled': { title: 'Order Cancelled', message: 'Your order has been successfully cancelled.' },
};

const Header = () => {
  const { user, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
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
        : `rasoiExpressUserNotifications_${user.uid}`;
    
    const syncNotificationsFromStorage = () => {
        const storedNotifications: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentNotifications = storedNotifications.filter((n: AppNotification) => n.timestamp >= sevenDaysAgo);

        if (recentNotifications.length < storedNotifications.length) {
            localStorage.setItem(storageKey, JSON.stringify(recentNotifications));
        }

        setNotifications(recentNotifications);
    };
    
    window.addEventListener('notificationsUpdated', syncNotificationsFromStorage);
    
    const processNotifications = (newItems: (Order | AdminMessage | SupportTicket)[], type: 'order' | 'message' | 'admin_order' | 'support_ticket') => {
        const allStoredNotifications: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const generatedNotifications: AppNotification[] = [];
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

        newItems.forEach(item => {
            let id: string, notif: AppNotification | null = null;
            const now = Date.now();

            if (type === 'admin_order' && 'status' in item) {
                const order = item as Order;
                if (order.status === 'Order Placed') {
                    id = `notif-admin-new-order-${order.id}`;
                    if (!allStoredNotifications.some(n => n.id === id)) {
                       notif = { id, timestamp: now, title: `New Order!`, message: `Order #${order.id.slice(-6)} from ${order.customerName}.`, read: false, type: 'admin_new_order', orderId: order.id, link: '/admin/orders' };
                    }
                }
                if (order.status === 'Delivered') {
                    id = `notif-admin-order-delivered-${order.id}`;
                    if (!allStoredNotifications.some(n => n.id === id)) {
                       notif = { id, timestamp: now, title: `Order Delivered`, message: `Order #${order.id.slice(-6)} for ${order.customerName} has been delivered.`, read: false, type: 'admin_order_delivered', orderId: order.id, link: '/admin/orders' };
                    }
                }
            } else if (type === 'order' && 'status' in item) {
                const order = item as Order;
                id = `notif-user-${order.id}-${order.status}`;
                if (!allStoredNotifications.some(n => n.id === id) && orderStatusNotificationMap[order.status]) {
                    const details = orderStatusNotificationMap[order.status]!;
                    notif = { id, timestamp: now, title: `${details.title}`, message: details.message, read: false, type: 'order_update', orderId: order.id, orderStatus: order.status, link: `/my-orders?track=${order.id}` };
                }
            } else if (type === 'message' && 'title' in item) {
                const msg = item as AdminMessage;
                id = `notif-message-${msg.id}`;
                if (!allStoredNotifications.some(n => n.id === id)) {
                    notif = { id, timestamp: msg.timestamp, title: msg.title, message: msg.message, read: false, type: 'admin_message' };
                }
            } else if (type === 'support_ticket' && 'message' in item) {
                const ticket = item as SupportTicket;
                id = `notif-admin-new-ticket-${ticket.id}`;
                if (ticket.status === 'Open' && !allStoredNotifications.some(n => n.id === id)) {
                   notif = { id, timestamp: now, title: `New Support Ticket`, message: `From ${ticket.userEmail || 'Guest'}: "${ticket.message.substring(0, 30)}..."`, read: false, type: 'admin_new_support_ticket', link: '/admin/support' };
                }
            }

            if (notif) {
                generatedNotifications.push(notif);
                const shouldShowSystemAlert = !(isInitialLoad.current && notif.timestamp < twentyFourHoursAgo);
                
                if (shouldShowSystemAlert) {
                    showSystemNotification(notif.title, { body: notif.message, tag: notif.id });
                }
            }
        });

        if (isInitialLoad.current) {
            isInitialLoad.current = false;
        }

        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentStoredNotifications = allStoredNotifications.filter(n => n.timestamp >= sevenDaysAgo);
        const cleanupPerformed = recentStoredNotifications.length < allStoredNotifications.length;

        if (generatedNotifications.length > 0 || cleanupPerformed) {
            const updatedList = [...generatedNotifications, ...recentStoredNotifications]
                .sort((a,b) => b.timestamp - a.timestamp)
                .slice(0, 50);
            
            localStorage.setItem(storageKey, JSON.stringify(updatedList));
            window.dispatchEvent(new Event('notificationsUpdated'));
        }
    };

    const unsubscribers: (()=>void)[] = [];

    if (isAdmin) {
        unsubscribers.push(listenToAllOrders(orders => processNotifications(orders, 'admin_order')));
        unsubscribers.push(listenToSupportTickets(tickets => processNotifications(tickets, 'support_ticket')));
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

}, [isClient, isAuthenticated, user, isAdmin, isAuthLoading]);

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
          <Link href='/' aria-label="Home"><RasoiXpressLogo /></Link>
          
          <nav className="hidden md:flex items-center space-x-2">
            <Link href="/"><Button variant="ghost"><Home className="mr-2 h-4 w-4" />Menu</Button></Link>
            <Link href="/categories"><Button variant="ghost"><LayoutGrid className="mr-2 h-4 w-4" />Categories</Button></Link>
            <Link href="/my-orders"><Button variant="ghost"><ListOrdered className="mr-2 h-4 w-4" />My Orders</Button></Link>
            <Button variant="ghost" onClick={() => setIsHelpDialogOpen(true)}><HelpCircle className="mr-2 h-4 w-4" />Help</Button>
            {isAdmin && <Link href="/admin"><Button variant="ghost" className="text-red-600"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Button></Link>}
            
            {isAuthenticated ? (
                <Link href="/profile"><Button variant="ghost"><User className="mr-2 h-4 w-4" />Profile</Button></Link>
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
