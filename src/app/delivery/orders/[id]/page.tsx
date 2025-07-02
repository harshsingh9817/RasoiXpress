
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bike, PackageCheck, ChefHat, User, PhoneCall, KeyRound, MapPin, ClipboardList, ArrowLeft, QrCode, CreditCard } from 'lucide-react';
import type { Order, OrderStatus, OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateOrderStatus, listenToOrderById, acceptOrderForDelivery } from '@/lib/data';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { useCart } from '@/contexts/CartContext';
import DirectionsMap from '@/components/DirectionsMap';

const statusIcons: Record<OrderStatus, React.ElementType> = {
  'Order Placed': ClipboardList,
  'Confirmed': ChefHat,
  'Preparing': ChefHat,
  'Out for Delivery': Bike,
  'Delivered': PackageCheck,
  'Cancelled': User,
};

export default function DeliveryOrderDetailPage() {
  const { user, isDelivery, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();
  const { isOrderingAllowed, setIsTimeGateDialogOpen } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [enteredCode, setEnteredCode] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);


  useEffect(() => {
    if (!isAuthLoading && !isDelivery) {
      router.replace('/delivery/login');
    }
  }, [isDelivery, isAuthLoading, router]);
  
  useEffect(() => {
    if(isDelivery && orderId) {
        setIsDataLoading(true);
        const unsubscribe = listenToOrderById(orderId, (fetchedOrder) => {
            setOrder(fetchedOrder);
            setIsDataLoading(false);
        });
        return () => unsubscribe();
    }
  }, [isDelivery, isAuthLoading, orderId, router]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    try {
        await updateOrderStatus(order.id, newStatus);
        toast({
            title: 'Order Updated!',
            description: `Order #${order.id.slice(-6)} is now marked as ${newStatus}.`,
        });
        // Real-time listener will update the order details automatically
    } catch (error) {
        console.error("Failed to update status", error);
        toast({ title: "Update Failed", description: "Could not update order status.", variant: "destructive" });
    }
  };
  
  const handleAcceptOrder = async () => {
    if (!isOrderingAllowed) {
      setIsTimeGateDialogOpen(true);
      return;
    }
    if (!order || !user) return;
    setIsAccepting(true);
    try {
        await acceptOrderForDelivery(order.id, user.uid, user.displayName || user.email || 'Unnamed Rider');
        toast({
            title: 'Order Accepted!',
            description: `You are now assigned to deliver order #${order.id.slice(-6)}.`,
        });
        // The real-time listener will update the view automatically.
    } catch (error: any) {
        console.error("Failed to accept order", error);
        toast({ title: "Failed to Accept", description: error.message || "Could not accept this order.", variant: "destructive" });
    } finally {
        setIsAccepting(false);
    }
  };

  const handleConfirmDelivery = () => {
     if (!isOrderingAllowed) {
        setIsTimeGateDialogOpen(true);
        return;
    }
    if (!order || !enteredCode) return;

    if (enteredCode === order.deliveryConfirmationCode) {
      handleUpdateStatus('Delivered');
      toast({
        title: 'Delivery Confirmed!',
        description: `Order #${order.id.slice(-6)} marked as delivered.`,
        variant: 'default',
      });
      router.push('/delivery/dashboard'); // Go back to dashboard after confirmation
    } else {
      toast({
        title: 'Incorrect Code',
        description: 'The confirmation code is incorrect. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'Delivered':
      case 'Out for Delivery':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };


  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          {isAuthLoading ? "Verifying access..." : "Loading order details..."}
        </p>
      </div>
    );
  }

  if (!order) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
            <h1 className="text-2xl font-bold">Order Not Found</h1>
            <p className="text-muted-foreground">This order could not be found or you don't have permission to view it.</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
    )
  }
  
  const Icon = statusIcons[order.status] || ClipboardList;
  const isMyDelivery = order.status === 'Out for Delivery' && order.deliveryRiderId === user?.uid;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <Button onClick={() => router.push('/delivery/dashboard')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center justify-between">
                    <span>Order #{order.id.slice(-6)}</span>
                    <Badge variant={getStatusVariant(order.status)}>
                        <Icon className="mr-1.5 h-4 w-4" />
                        {order.status}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Placed on: {new Date(order.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Customer Details */}
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Customer Details</h3>
                    <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {order.customerName}</p>
                        <p><span className="font-medium">Email:</span> {order.userEmail}</p>
                        <div className="flex items-center justify-between pt-1">
                            <p><span className="font-medium">Phone:</span> {order.customerPhone || 'N/A'}</p>
                             {order.customerPhone && (
                                  <Button size="sm" variant="outline" asChild>
                                      <a href={`tel:${order.customerPhone}`}>Call Customer</a>
                                  </Button>
                               )}
                        </div>
                    </div>
                </div>

                 {/* Shipping Details & Map */}
                 <div className="p-4 border rounded-lg space-y-3">
                    <h3 className="font-semibold flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/>Shipping Address</h3>
                    <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                    {isMyDelivery && (
                        <div className="pt-2">
                           <DirectionsMap destinationAddress={order.shippingAddress} />
                        </div>
                    )}
                </div>
                
                 {/* Order Items */}
                 <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary"/>Order Items</h3>
                     <div className="space-y-2">
                        {order.items.map((item: OrderItem) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <Image 
                                        src={(item.imageUrl ?? 'https://placehold.co/40x40.png').split('?data-ai-hint=')[0].split('data-ai-hint=')[0]}
                                        alt={item.name ?? 'Food item'} 
                                        width={40} 
                                        height={40} 
                                        className="rounded-md object-cover" 
                                    />
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">x {item.quantity}</p>
                                    </div>
                                </div>
                                <p>Rs.{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment & Total */}
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Details</h3>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="flex items-center">
                                {order.paymentMethod === 'Razorpay' ? <CreditCard className="mr-1.5 h-4 w-4" /> : <QrCode className="mr-1.5 h-4 w-4" />}
                                {order.paymentMethod}
                            </span>
                        </div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-bold text-base mt-2">
                            <span>Grand Total:</span>
                            <span className="text-primary">Rs.{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </CardContent>
            <CardFooter className="flex-col gap-4 items-stretch p-4">
               {order.isAvailableForPickup && !order.deliveryRiderId && (
                  <Button 
                    className="w-full text-lg py-6"
                    onClick={handleAcceptOrder}
                    disabled={isAccepting}
                  >
                    {isAccepting ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <Bike className="mr-2 h-5 w-5" />}
                    {isAccepting ? 'Starting...' : 'Start Delivery'}
                  </Button>
               )}
               {isMyDelivery && (
                  <div className="w-full p-4 border rounded-lg bg-muted/50 space-y-3">
                    <Label htmlFor="confirmation-code" className="font-semibold flex items-center text-base">
                        <KeyRound className="mr-2 h-5 w-5 text-primary"/>
                        Confirm Delivery
                    </Label>
                    <p className="text-sm text-muted-foreground">Enter the 4-digit code from the customer to complete the order.</p>
                    <div className="flex gap-2">
                        <Input
                            id="confirmation-code"
                            value={enteredCode}
                            onChange={(e) => setEnteredCode(e.target.value)}
                            placeholder="1234"
                            maxLength={4}
                            className="text-center text-lg tracking-[0.5rem] flex-grow"
                            aria-label="Delivery confirmation code"
                        />
                        <Button onClick={handleConfirmDelivery} disabled={!enteredCode || enteredCode.length < 4} className="flex-shrink-0">
                            Confirm
                        </Button>
                    </div>
                  </div>
               )}
            </CardFooter>
        </Card>
    </div>
  );
}
