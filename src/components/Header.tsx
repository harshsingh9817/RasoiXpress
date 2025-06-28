"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home, User, LogIn, UserPlus, ShieldCheck, HelpCircle, Bell, Loader2, ListOrdered,
  Package, MessageSquare, PackagePlus, ClipboardCheck, ChefHat, Truck, Bike, PackageCheck as DeliveredIcon, XCircle,
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
  'Order Placed': { title: 'Payment Successful!', message: 'Your order has been placed. The restaurant will confirm it shortly.' },
  'Confirmed': { title: 'Order Confirmed', message: 'The restaurant is preparing your order.' },
  'Preparing': { title: 'Order in the Kitchen', message: 'Your meal is being freshly prepared by the chefs!' },
  'Shipped': { title: 'Order Shipped', message: 'Your order has been dispatched from the restaurant.' },
  'Out for Delivery': { title: 'Out for Delivery', message: 'Your delivery partner is on the way to your location!' },
  'Delivered': { title: 'Order Delivered!', message: 'We hope you enjoy your meal! You can now leave a review.' },
  'Cancelled': { title: 'Order Cancelled', message: 'Your order has been successfully cancelled.' },
};

const getNotificationIcon = (notification: AppNotification) => {
    const iconClass = `h-5 w-5 flex-shrink-0 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`;
    switch (notification.type) {
        case 'admin_new_order': return <Package className={iconClass} />;
        case 'admin_order_delivered': return <DeliveredIcon className={iconClass} />;
        case 'admin_message': return <MessageSquare className={iconClass} />;
        case 'delivery_assignment': return <Bike className={iconClass} />;
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
                }
            }
    }
    return <Bell className={iconClass} />;
}

const Header = () => {
  const { user, isAuthenticated, isAdmin, isDelivery, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<AppNotification | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const showSystemNotification = (title: string, options: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options));
    }
  };

  const syncNotifications = useCallback(async () => {
    if (isAuthLoading || !isAuthenticated || !user) {
        setNotifications([]);
        setIsLoadingNotifications(false);
        return;
    }
    setIsLoadingNotifications(true);

    const storageKey = isAdmin ? 'rasoiExpressAdminNotifications' : isDelivery ? 'rasoiExpressDeliveryNotifications' : 'rasoiExpressUserNotifications';
    const existingNotifications: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const generatedNotifications: AppNotification[] = [];

    if (isAdmin) {
        const allOrders = await getAllOrders();
        allOrders.forEach(order => {
            if (order.status === 'Order Placed') {
                const id = `notif-admin-new-order-${order.id}`;
                if (!existingNotifications.some(n => n.id === id)) {
                    generatedNotifications.push({ id, timestamp: new Date(order.date).getTime(), title: `New Order!`, message: `Order #${order.id.slice(-6)} from ${order.customerName}.`, read: false, type: 'admin_new_order', orderId: order.id, link: '/admin/orders' });
                }
            }
        });
    } else if (!isDelivery) {
        const userOrders = await getUserOrders(user.uid);
        userOrders.forEach(order => {
            const id = `notif-${order.id}-${order.status}`;
            if (!existingNotifications.some(n => n.id === id) && orderStatusNotificationMap[order.status]) {
                const details = orderStatusNotificationMap[order.status]!;
                generatedNotifications.push({ id, timestamp: new Date(order.date).getTime(), title: `${details.title}`, message: details.message, read: false, type: 'order_update', orderId: order.id, link: `/my-orders?track=${order.id}` });
            }
        });
        const adminMessages = await getUserAdminMessages(user.uid);
        adminMessages.forEach(msg => {
          const id = `notif-${msg.id}`;
          if (!existingNotifications.some(n => n.id === id)) {
            generatedNotifications.push({ id, timestamp: msg.timestamp, title: msg.title, message: msg.message, read: false, type: 'admin_message' });
          }
        });
    }
    
    generatedNotifications.forEach(n => showSystemNotification(n.title, { body: n.message, tag: n.id }));

    const allNotifications = [...existingNotifications, ...generatedNotifications].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    setNotifications(allNotifications);
    localStorage.setItem(storageKey, JSON.stringify(allNotifications));
    setIsLoadingNotifications(false);
  }, [isAuthenticated, user, isAdmin, isDelivery, isAuthLoading]);

  useEffect(() => {
    if (isClient && isAuthenticated && !isAuthLoading) {
      syncNotifications();
    }
  }, [isClient, pathname, isAuthenticated, isAuthLoading, syncNotifications]);


  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: AppNotification) => {
    const updatedNotifications = notifications.map(n => n.id === notification.id ? { ...n, read: true } : n);
    setNotifications(updatedNotifications);
    const storageKey = isAdmin ? 'rasoiExpressAdminNotifications' : isDelivery ? 'rasoiExpressDeliveryNotifications' : 'rasoiExpressUserNotifications';
    localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));

    if (notification.type === 'admin_message') {
        setViewingMessage(notification);
    } else if (notification.link) {
        router.push(notification.link);
    }
    setIsNotificationPanelOpen(false);
  };

  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-sidebar-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="Home"><RasoiXpressLogo /></Link>
          <nav className="hidden md:flex items-center space-x-2">
            {!isDelivery && <Link href="/"><Button variant="ghost"><Home className="mr-2 h-4 w-4" />Menu</Button></Link>}
            {!isDelivery && !isAdmin && <Link href="/my-orders"><Button variant="ghost"><ListOrdered className="mr-2 h-4 w-4" />My Orders</Button></Link>}
            <Button variant="ghost" onClick={() => setIsHelpDialogOpen(true)}><HelpCircle className="mr-2 h-4 w-4" />Help</Button>
            {isDelivery && <Link href="/delivery/dashboard"><Button variant="ghost"><Bike className="mr-2 h-4 w-4" />Rider Panel</Button></Link>}
            {isAdmin && <Link href="/admin"><Button variant="ghost" className="text-red-600"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Button></Link>}
            <Link href={isDelivery ? "/delivery/profile" : "/profile"}><Button variant="ghost"><User className="mr-2 h-4 w-4" />Profile</Button></Link>
            <Popover open={isNotificationPanelOpen} onOpenChange={setIsNotificationPanelOpen}>
              <PopoverTrigger asChild><Button variant="outline" size="icon" className="relative rounded-full"><Bell className="h-5 w-5 text-accent" />{isClient && unreadNotificationCount > 0 && <Badge className="absolute -right-2 -top-2 h-6 w-6 justify-center rounded-full p-0">{unreadNotificationCount}</Badge>}</Button></PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <div className="p-4 font-medium border-b">Notifications</div>
                {isLoadingNotifications ? <div className="p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> : notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(n => <div key={n.id} className={`flex items-start p-3 border-b hover:bg-muted/50 cursor-pointer ${!n.read && 'bg-primary/5'}`} onClick={() => handleNotificationClick(n)}>{getNotificationIcon(n)}<div className="flex-1 ml-3"><p className={`font-semibold text-sm ${!n.read && 'text-primary'}`}>{n.title}</p><p className="text-xs text-muted-foreground">{n.message}</p></div></div>)}
                  </div>
                ) : <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>}
              </PopoverContent>
            </Popover>
          </nav>
        </div>
      </header>
      <HelpDialog isOpen={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen} />
      <Dialog open={!!viewingMessage} onOpenChange={(isOpen) => !isOpen && setViewingMessage(null)}><DialogContent><DialogHeader><DialogTitle>{viewingMessage?.title}</DialogTitle></DialogHeader><div className="py-4">{viewingMessage?.message}</div></DialogContent></Dialog>
    </>
  );
};

export default Header;
