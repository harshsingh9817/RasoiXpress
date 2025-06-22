
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Bike, PackageCheck, ChefHat, Truck, User, Mail, MapPin, ClipboardList } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type ActionableStatus = 'Confirmed' | 'Preparing' | 'Shipped' | 'Out for Delivery';

const getNextStatus = (currentStatus: ActionableStatus): OrderStatus | null => {
    const statusFlow: Record<ActionableStatus, OrderStatus> = {
        'Confirmed': 'Preparing',
        'Preparing': 'Shipped',
        'Shipped': 'Out for Delivery',
        'Out for Delivery': 'Delivered',
    };
    return statusFlow[currentStatus] || null;
};

const getActionText = (currentStatus: ActionableStatus): string => {
    const actionTextMap: Record<ActionableStatus, string> = {
        'Confirmed': 'Start Preparing',
        'Preparing': 'Mark as Shipped',
        'Shipped': 'Start Delivery',
        'Out for Delivery': 'Mark as Delivered',
    };
    return actionTextMap[currentStatus] || 'Update Status';
}

const statusIcons: Record<OrderStatus, React.ElementType> = {
  'Order Placed': ClipboardList,
  'Confirmed': ChefHat,
  'Preparing': ChefHat,
  'Shipped': Truck,
  'Out for Delivery': Bike,
  'Delivered': PackageCheck,
  'Cancelled': User, // Not used here, but for completeness
};

export default function DeliveryDashboard() {
  const { user, isDelivery, isLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!isLoading && !isDelivery) {
      router.replace('/delivery/login');
    }
  }, [isDelivery, isLoading, router]);
  
  useEffect(() => {
    if (isDelivery && isClient) {
      const allOrdersString = localStorage.getItem('rasoiExpressAllOrders');
      if (allOrdersString) {
          try {
              const allOrders = JSON.parse(allOrdersString) as Order[];
              // Filter for orders that are actionable by delivery personnel
              const filteredOrders = allOrders.filter(o => 
                o.status === 'Confirmed' || 
                o.status === 'Preparing' || 
                o.status === 'Shipped' || 
                o.status === 'Out for Delivery'
              );
              setActiveOrders(filteredOrders.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
          } catch(e) {
              console.error("Failed to parse all orders from localStorage", e);
          }
      }
    }
  }, [isDelivery, isClient]);

  const handleUpdateStatus = (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus as ActionableStatus);
    if (!nextStatus) return;

    const allOrdersString = localStorage.getItem('rasoiExpressAllOrders');
    if (allOrdersString) {
        let allOrders = JSON.parse(allOrdersString) as Order[];
        const orderIndex = allOrders.findIndex(o => o.id === orderId);

        if (orderIndex !== -1) {
            allOrders[orderIndex].status = nextStatus;
            localStorage.setItem('rasoiExpressAllOrders', JSON.stringify(allOrders));

            // Update local state to reflect the change immediately
            if (nextStatus === 'Delivered') {
                setActiveOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
            }
            
            toast({
                title: 'Order Updated!',
                description: `Order ${orderId.slice(-5)} is now marked as ${nextStatus}.`,
            });
        }
    }
  };


  if (isLoading || !isClient || !isDelivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isLoading ? "Verifying delivery access..." : "Redirecting..."}
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
        <Button onClick={logout} variant="outline">Logout</Button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.length > 0 ? activeOrders.map(order => {
            const Icon = statusIcons[order.status] || ClipboardList;
            return (
                <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Order #{order.id.slice(-6)}</span>
                             <Badge variant={order.status === 'Shipped' || order.status === 'Out for Delivery' ? 'default' : 'secondary'}>
                               <Icon className="mr-1.5 h-3 w-3" />
                               {order.status}
                             </Badge>
                        </CardTitle>
                        <CardDescription>
                            Placed on: {new Date(order.date).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-grow">
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Customer:</p>
                            <p className="pl-6 text-muted-foreground">{order.userEmail}</p>
                        </div>
                         <div className="space-y-1 text-sm">
                            <p className="font-semibold flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground"/>Address:</p>
                            <p className="pl-6 text-muted-foreground">{order.shippingAddress}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold flex items-center"><ClipboardList className="mr-2 h-4 w-4 text-muted-foreground"/>Items:</p>
                            <ul className="pl-6 text-muted-foreground list-disc list-inside">
                                {order.items.map(item => (
                                    <li key={item.id}>{item.name} (x{item.quantity})</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                       <Button 
                        className="w-full" 
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                        disabled={!getNextStatus(order.status as ActionableStatus)}
                       >
                         {getActionText(order.status as ActionableStatus)}
                       </Button>
                    </CardFooter>
                </Card>
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

    