
"use client";

import { useEffect, useState } from "react";
import type { AppNotification } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Bell, ArrowLeft, Package, MessageSquare, PackagePlus, ClipboardCheck, ChefHat, Bike, PackageCheck as DeliveredIcon, XCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const getNotificationIcon = (notification: AppNotification) => {
    const iconClass = `h-6 w-6 flex-shrink-0 transition-colors ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`;
    switch (notification.type) {
        case 'admin_new_order': return <Package className={iconClass} />;
        case 'admin_order_delivered': return <DeliveredIcon className={iconClass} />;
        case 'admin_message': return <MessageSquare className={iconClass} />;
        case 'delivery_available': return <Bike className={iconClass} />;
        case 'order_update':
            if (notification.orderStatus) {
                switch (notification.orderStatus) {
                    case 'Order Placed': return <PackagePlus className={iconClass} />;
                    case 'Confirmed': return <ClipboardCheck className={iconClass} />;
                    case 'Preparing': return <ChefHat className={iconClass} />;
                    case 'Out for Delivery': return <Bike className={iconClass} />;
                    case 'Delivered': return <DeliveredIcon className={iconClass} />;
                    case 'Cancelled': return <XCircle className={iconClass} />;
                }
            }
    }
    return <Bell className={iconClass} />;
};

export default function NotificationsPage() {
    const { user, isAuthenticated, isLoading: isAuthLoading, isAdmin, isDelivery } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingMessage, setViewingMessage] = useState<AppNotification | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const storageKey = isAdmin 
        ? 'rasoiExpressAdminNotifications' 
        : isDelivery 
        ? 'rasoiExpressDeliveryNotifications' 
        : `rasoiExpressUserNotifications_${user?.uid}`;

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (isAuthenticated) {
            const storedNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            const sanitizedNotifications = storedNotifications.map((n: any) => {
                if (n.timestamp && typeof n.timestamp === 'object' && n.timestamp.seconds !== undefined) {
                    return { ...n, timestamp: n.timestamp.seconds * 1000 };
                }
                return n;
            });
            
            setNotifications(sanitizedNotifications);
            setInitialLoadComplete(true);
        }

        setIsLoading(false);

    }, [isAuthLoading, isAuthenticated, router, storageKey]);
    
    // Mark notifications as read after they have been rendered
    useEffect(() => {
        if (initialLoadComplete && notifications.length > 0) {
            const hasUnread = notifications.some(n => !n.read);
            if (hasUnread) {
                const timer = setTimeout(() => {
                    const updatedNotifications = notifications.map((n: AppNotification) => ({...n, read: true}));
                    localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
                    window.dispatchEvent(new Event('notificationsUpdated'));
                    // We don't need to call setNotifications here because the visual change is handled by CSS
                    // and the badge count is updated globally. The next time the component loads, it will get the new state.
                }, 1500); // Wait 1.5s before marking as read

                return () => clearTimeout(timer);
            }
        }
    }, [initialLoadComplete, notifications, storageKey]);
    
    const handleNotificationClick = (notification: AppNotification) => {
      if (notification.type === 'admin_message') {
        setViewingMessage(notification);
      } else if (notification.link) {
        router.push(notification.link);
      }
    };

    const handleGoBack = () => {
        if (isAdmin) {
            router.push('/admin');
        } else if (isDelivery) {
            router.push('/delivery/dashboard');
        } else {
            router.push('/');
        }
    };

    if (isLoading || isAuthLoading) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="mt-4 text-xl text-muted-foreground">Loading notifications...</p>
          </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline flex items-center">
                        <Bell className="mr-3 h-6 w-6 text-primary"/>
                        Notifications
                    </CardTitle>
                    <CardDescription>Your recent updates and messages.</CardDescription>
                </CardHeader>
                <CardContent>
                    {notifications.length > 0 ? (
                        <div className="space-y-4">
                            {notifications.sort((a,b) => b.timestamp - a.timestamp).map(n => (
                                <div key={n.id} className={cn("flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors duration-500", !n.read && "bg-primary/5 border-primary/20")} onClick={() => handleNotificationClick(n)}>
                                    {getNotificationIcon(n)}
                                    <div className="flex-1">
                                        <p className={cn("font-semibold transition-colors", !n.read && "text-primary")}>{n.title}</p>
                                        <p className="text-sm text-muted-foreground">{n.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{n.timestamp ? `${formatDistanceToNow(new Date(n.timestamp))} ago` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <Bell className="mx-auto h-16 w-16 text-muted-foreground/50" />
                            <p className="mt-4 text-lg text-muted-foreground">You have no notifications yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!viewingMessage} onOpenChange={(isOpen) => !isOpen && setViewingMessage(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewingMessage?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 whitespace-pre-wrap">{viewingMessage?.message}</div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
