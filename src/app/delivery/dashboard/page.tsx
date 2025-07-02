
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bike, PackageCheck, ChefHat, User, MapPin, ClipboardList, PackageSearch } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const statusIcons: Record<OrderStatus, React.ElementType> = {
  'Order Placed': ClipboardList,
  'Confirmed': ChefHat,
  'Preparing': ChefHat,
  'Out for Delivery': Bike,
  'Delivered': PackageCheck,
  'Cancelled': User,
};

const OrderCard = ({ order, isAvailable }: { order: Order; isAvailable?: boolean }) => {
    const Icon = statusIcons[order.status] || ClipboardList;
    return (
        <Link href={`/delivery/orders/${order.id}`} key={order.id} className="block h-full group">
            <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full group-hover:border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Order #{order.id.slice(-6)}</span>
                        <Badge variant={isAvailable ? 'default' : 'secondary'}>
                        <Icon className="mr-1.5 h-3 w-3" />
                        {isAvailable ? 'Ready for Pickup' : order.status}
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
                   <p className="text-xs text-muted-foreground w-full text-center group-hover:text-primary transition-colors">Click to {isAvailable ? 'start delivery' : 'view details'}</p>
                </CardFooter>
            </Card>
        </Link>
    );
};

export default function DeliveryDashboard() {
  const { user, isDelivery, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myActiveOrders, setMyActiveOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !isDelivery) {
      router.replace('/delivery/login');
    }
  }, [isDelivery, isAuthLoading, router]);
  
  useEffect(() => {
    if (isDelivery && user) {
        setIsDataLoading(true);

        const ordersRef = collection(db, 'orders');

        // Listener for available orders, now using the 'isAvailableForPickup' flag
        const availableQuery = query(ordersRef, where('isAvailableForPickup', '==', true));
        const unsubscribeAvailable = onSnapshot(availableQuery, (snapshot) => {
            const available = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setAvailableOrders(available.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            if (isDataLoading) {
              setIsDataLoading(false);
            }
        }, (error) => {
            console.error("Error fetching available orders:", error);
            toast({ title: "Error", description: "Could not fetch available orders.", variant: "destructive" });
            setIsDataLoading(false);
        });

        // Listener for my active orders
        const myActiveQuery = query(ordersRef, where('deliveryRiderId', '==', user.uid), where('status', '==', 'Out for Delivery'));
        const unsubscribeMyActive = onSnapshot(myActiveQuery, (snapshot) => {
            const active = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setMyActiveOrders(active.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }, (error) => {
            console.error("Error fetching my active orders:", error);
            toast({ title: "Error", description: "Could not fetch your active orders.", variant: "destructive" });
        });

        return () => {
            unsubscribeAvailable();
            unsubscribeMyActive();
        };
    }
  }, [isDelivery, isAuthLoading, user, toast]);


  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          {isAuthLoading ? "Verifying delivery access..." : "Loading orders..."}
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

      <div className="space-y-8">
        {/* Your Active Deliveries Section */}
        <div>
            <h2 className="text-2xl font-headline font-bold mb-4">Your Active Deliveries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myActiveOrders.length > 0 ? (
                    myActiveOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:grid-cols-3 text-center py-12 bg-card rounded-lg">
                        <Bike className="mx-auto h-24 w-24 text-muted-foreground/50" />
                        <h2 className="mt-4 text-2xl font-semibold">All Caught Up!</h2>
                        <p className="text-muted-foreground">You don't have any active deliveries right now.</p>
                    </div>
                )}
            </div>
        </div>

        <Separator />

        {/* Available for Pickup Section */}
        <div>
            <h2 className="text-2xl font-headline font-bold mb-4">Available for Pickup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableOrders.length > 0 ? (
                    availableOrders.map(order => <OrderCard key={order.id} order={order} isAvailable />)
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:grid-cols-3 text-center py-12 bg-card rounded-lg">
                        <PackageSearch className="mx-auto h-24 w-24 text-muted-foreground/50" />
                        <h2 className="mt-4 text-2xl font-semibold">No Available Orders</h2>
                        <p className="text-muted-foreground">There are no new orders waiting for pickup.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
