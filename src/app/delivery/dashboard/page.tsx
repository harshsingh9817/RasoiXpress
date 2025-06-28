
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Bike, PackageCheck, ChefHat, User, MapPin, ClipboardList } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { listenToAllOrders } from '@/lib/data';
import Link from 'next/link';

const statusIcons: Record<OrderStatus, React.ElementType> = {
  'Order Placed': ClipboardList,
  'Confirmed': ChefHat,
  'Preparing': ChefHat,
  'Out for Delivery': Bike,
  'Delivered': PackageCheck,
  'Cancelled': User,
};

export default function DeliveryDashboard() {
  const { user, isDelivery, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !isDelivery) {
      router.replace('/delivery/login');
    }
  }, [isDelivery, isAuthLoading, router]);
  
  useEffect(() => {
    if (isDelivery) {
        setIsDataLoading(true);
        const unsubscribe = listenToAllOrders((allOrders) => {
            const deliveryStatuses: OrderStatus[] = ['Out for Delivery'];
            const filteredOrders = allOrders.filter(order => deliveryStatuses.includes(order.status));
            
            const sortedOrders = filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setActiveOrders(sortedOrders);
            setIsDataLoading(false);
        });
        return () => unsubscribe();
    }
  }, [isDelivery, isAuthLoading]);


  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading ? "Verifying delivery access..." : "Loading active orders..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-card border">
        <div className="text-center sm:text-left">
            <h1 className="text-3xl font-headline font-bold text-primary mb-1">Delivery Dashboard</h1>
            <p className="text-md text-muted-foreground">
                Welcome, {user?.displayName || user?.email}! Here are the active orders.
            </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.length > 0 ? activeOrders.map(order => {
            const Icon = statusIcons[order.status] || ClipboardList;
            return (
                <Link href={`/delivery/orders/${order.id}`} key={order.id} className="block h-full group">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full group-hover:border-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Order #{order.id.slice(-6)}</span>
                                <Badge variant={order.status === 'Out for Delivery' ? 'default' : 'secondary'}>
                                <Icon className="mr-1.5 h-3 w-3" />
                                {order.status}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Placed: {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-grow">
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Customer:</p>
                                <p className="pl-6 text-muted-foreground">{order.customerName}</p>
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>Address:</p>
                                <p className="pl-6 text-muted-foreground line-clamp-2">{order.shippingAddress}</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <p className="text-xs text-muted-foreground w-full text-center group-hover:text-primary transition-colors">Click to view details & actions</p>
                        </CardFooter>
                    </Card>
                </Link>
            )
        }) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
                <Bike className="mx-auto h-24 w-24 text-muted-foreground/50" />
                <h2 className="mt-4 text-2xl font-semibold">All Caught Up!</h2>
                <p className="text-muted-foreground">There are no active orders needing attention right now.</p>
            </div>
        )}
      </div>
    </div>
  );
}
