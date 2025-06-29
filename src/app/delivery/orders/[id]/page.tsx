"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bike, PackageCheck, ChefHat, User, PhoneCall, KeyRound, MapPin, ClipboardList, ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import type { Order, OrderStatus, OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateOrderStatus, listenToOrderById, acceptOrderForDelivery } from '@/lib/data';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';

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

  const [order, setOrder] = useState<Order | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);


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


  const handleOpenConfirmDialog = () => {
    setEnteredCode('');
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelivery = () => {
    if (!order || !enteredCode) return;

    if (enteredCode === order.deliveryConfirmationCode) {
      handleUpdateStatus('Delivered');
      setIsConfirmDialogOpen(false);
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
  
    const handleGetDirections = () => {
    if (!order) return;
    setIsGettingLocation(true);
    const destination = encodeURIComponent(order.shippingAddress);

    if (!navigator.geolocation) {
        toast({
            title: "Geolocation not supported",
            description: "Your browser doesn't support location services. Opening Maps with destination only.",
            variant: "destructive",
        });
        window.open(`https://www.google.com/maps?daddr=${destination}&saddr=My+Location`, '_blank', 'noopener,noreferrer');
        setIsGettingLocation(false);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const origin = `${latitude},${longitude}`;
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
            window.open(mapsUrl, '_blank', 'noopener,noreferrer');
            setIsGettingLocation(false);
        },
        (error) => {
            console.error("Geolocation error:", error);
            let description = "Could not get your location. Please check settings and try again.";
            if (error.code === error.PERMISSION_DENIED) {
                description = "Location access was denied. Please enable it in your browser settings.";
            }
            toast({
                title: "Location Error",
                description: description,
                variant: "destructive",
            });
            window.open(`https://www.google.com/maps?daddr=${destination}&saddr=My+Location`, '_blank', 'noopener,noreferrer');
            setIsGettingLocation(false);
        }
    );
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

                 {/* Shipping Details */}
                 <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/>Shipping Address</h3>
                    <p className="text-sm text-muted-foreground mb-3">{order.shippingAddress}</p>
                    <Button onClick={handleGetDirections} disabled={isGettingLocation} className="w-full">
                        {isGettingLocation ? (
                            <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div>
                        ) : (
                            <MapPin className="mr-2 h-4 w-4" />
                        )}
                        {isGettingLocation ? 'Getting Location...' : 'Get Directions'}
                    </Button>
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
                    <h3 className="font-semibold mb-2 flex items-center"><Wallet className="mr-2 h-5 w-5 text-primary"/>Payment Details</h3>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="flex items-center">
                                {order.paymentMethod === 'UPI' ? <CreditCard className="mr-1.5 h-4 w-4" /> : <Wallet className="mr-1.5 h-4 w-4" />}
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
            <CardFooter>
               {order.status === 'Confirmed' && !order.deliveryRiderId && (
                  <Button 
                    className="w-full text-lg py-6"
                    onClick={handleAcceptOrder}
                    disabled={isAccepting}
                  >
                    {isAccepting ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <Bike className="mr-2 h-5 w-5" />}
                    {isAccepting ? 'Accepting...' : 'Accept for Delivery'}
                  </Button>
               )}
               {order.status === 'Out for Delivery' && order.deliveryRiderId === user?.uid && (
                  <Button 
                    className="w-full text-lg py-6"
                    onClick={handleOpenConfirmDialog}
                  >
                    <KeyRound className="mr-2 h-5 w-5" />
                    Confirm Delivery
                  </Button>
               )}
            </CardFooter>
        </Card>

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
