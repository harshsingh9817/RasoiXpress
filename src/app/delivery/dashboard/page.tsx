
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Bike, PackageCheck, ChefHat, Truck, User, PhoneCall, KeyRound, MapPin, ClipboardList } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// UPDATED: Added 'Order Placed' to allow delivery staff to confirm new orders
type ActionableStatus = 'Order Placed' | 'Confirmed' | 'Preparing' | 'Shipped' | 'Out for Delivery';

const getNextStatus = (currentStatus: ActionableStatus): OrderStatus | null => {
    const statusFlow: Record<ActionableStatus, OrderStatus> = {
        'Order Placed': 'Confirmed',      // UPDATED: Added new step
        'Confirmed': 'Preparing',
        'Preparing': 'Shipped',
        'Shipped': 'Out for Delivery',    // FIXED: Corrected status value
        'Out for Delivery': 'Delivered',
    };
    return statusFlow[currentStatus] || null;
};

const getActionText = (currentStatus: ActionableStatus): string => {
    const actionTextMap: Record<ActionableStatus, string> = {
        'Order Placed': 'Confirm Order', // UPDATED: Added new action text
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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
  const [enteredCode, setEnteredCode] = useState('');

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
              // UPDATED: Filter for orders that are actionable, now including 'Order Placed'
              const filteredOrders = allOrders.filter(o => 
                o.status === 'Order Placed' || 
                o.status === 'Confirmed' || 
                o.status === 'Preparing' || 
                o.status === 'Shipped' || 
                o.status === 'Out for Delivery'
              );
              // Show newest orders first
              setActiveOrders(filteredOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          } catch(e) {
              console.error("Failed to parse all orders from localStorage", e);
          }
      }
    }
  }, [isDelivery, isClient]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    const allOrdersString = localStorage.getItem('rasoiExpressAllOrders');
    if (allOrdersString) {
        let allOrders = JSON.parse(allOrdersString) as Order[];
        const orderIndex = allOrders.findIndex(o => o.id === orderId);

        if (orderIndex !== -1) {
            allOrders[orderIndex].status = newStatus;
            localStorage.setItem('rasoiExpressAllOrders', JSON.stringify(allOrders));

            // Update local state to reflect the change immediately
            if (newStatus === 'Delivered') {
                setActiveOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
                setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
            
            toast({
                title: 'Order Updated!',
                description: `Order ${orderId.slice(-5)} is now marked as ${newStatus}.`,
            });
        }
    }
  };

  const handleOpenConfirmDialog = (order: Order) => {
    setOrderToConfirm(order);
    setEnteredCode('');
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelivery = () => {
    if (!orderToConfirm || !enteredCode) return;

    if (enteredCode === orderToConfirm.deliveryConfirmationCode) {
      handleUpdateStatus(orderToConfirm.id, 'Delivered');
      setIsConfirmDialogOpen(false);
      setOrderToConfirm(null);
      toast({
        title: 'Delivery Confirmed!',
        description: `Order ${orderToConfirm.id.slice(-5)} marked as delivered.`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Incorrect Code',
        description: 'The confirmation code is incorrect. Please try again.',
        variant: 'destructive',
      });
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
                        {order.customerPhone && (
                           <div className="space-y-1 text-sm">
                              <p className="font-semibold flex items-center"><PhoneCall className="mr-2 h-4 w-4 text-muted-foreground"/>Contact:</p>
                               <div className="pl-6 flex items-center justify-between">
                                 <p className="text-muted-foreground">{order.customerPhone}</p>
                                  <Button size="sm" variant="outline" asChild>
                                      <a href={`tel:${order.customerPhone}`}>Call</a>
                                  </Button>
                               </div>
                           </div>
                        )}
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
                      {order.status === 'Out for Delivery' ? (
                          <Button 
                            className="w-full" 
                            onClick={() => handleOpenConfirmDialog(order)}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Confirm Delivery
                          </Button>
                       ) : (
                         <Button 
                          className="w-full" 
                          onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status as ActionableStatus)!)}
                          disabled={!getNextStatus(order.status as ActionableStatus)}
                         >
                           {getActionText(order.status as ActionableStatus)}
                         </Button>
                       )}
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

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Confirm Delivery</DialogTitle>
                <DialogDescription>
                    Enter the 4-digit code provided by the customer to confirm that the order has been delivered.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="confirmation-code">Delivery Code</Label>
                    <Input
                        id="confirmation-code"
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value)}
                        placeholder="1234"
                        maxLength={4}
                        className="text-center text-2xl tracking-[1rem]"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmDelivery} disabled={!enteredCode || enteredCode.length < 4}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    