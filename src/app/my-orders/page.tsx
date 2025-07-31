

"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PackageSearch, PackagePlus, ClipboardCheck, ChefHat, Bike, PackageCheck as DeliveredIcon, AlertTriangle, XCircle, FileText, Ban, Star, ShieldCheck, ArrowLeft, CreditCard, QrCode, UserCheck, Phone, TimerOff, Car, PersonStanding
} from 'lucide-react';
import Image from 'next/image';
import type { Order, OrderItem, OrderStatus, Review } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { listenToUserOrders, cancelOrder, submitOrderReview, listenToRiderAppOrders } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';

const orderProgressSteps: OrderStatus[] = [ 'Order Placed', 'Confirmed', 'Accepted by Rider', 'Preparing', 'Out for Delivery', 'Delivered' ];
const stepIcons: Record<OrderStatus, React.ElementType> = { 'Order Placed': PackagePlus, 'Confirmed': ClipboardCheck, 'Accepted by Rider': UserCheck, 'Preparing': ChefHat, 'Out for Delivery': Bike, 'Delivered': DeliveredIcon, 'Cancelled': XCircle, 'Expired': TimerOff };

const CANCELLATION_REASONS = [ "Ordered by mistake", "Want to change items in the order", "Delivery time is too long", "Found a better deal elsewhere", "Personal reasons", "Other (please specify if possible)" ];

export default function MyOrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: firebaseUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

    // Dialog states
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [selectedCancelReason, setSelectedCancelReason] = useState<string>('');
    const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
    const [orderForBillView, setOrderForBillView] = useState<Order | null>(null);
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    const [orderToReview, setOrderToReview] = useState<Order | null>(null);
    const [currentRating, setCurrentRating] = useState(0);
    const [currentReviewComment, setCurrentReviewComment] = useState('');

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }
        if (!firebaseUser) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        const unsubscribeUserOrders = listenToUserOrders(firebaseUser.uid, (userOrders) => {
            setOrders(userOrders);

            const trackParam = searchParams.get('track');
            if (trackParam) {
                const orderToTrack = userOrders.find(o => o.id === trackParam);
                setTrackedOrder(orderToTrack || null);
            }
            setIsLoading(false);
        });
        
        // The main listener in data.ts now handles the update, so we just need to listen for changes.
        const unsubscribeRiderUpdates = listenToRiderAppOrders(() => {});

        return () => {
            unsubscribeUserOrders();
            unsubscribeRiderUpdates();
        };
    }, [isAuthenticated, isAuthLoading, firebaseUser, router, searchParams]);


    const handleTrackOrderFromList = (order: Order) => {
        setTrackedOrder(order);
        router.push(`/my-orders?track=${order.id}`, { scroll: false });
    };
    
    const handleBackToList = () => {
        setTrackedOrder(null);
        router.push('/my-orders', { scroll: false });
    };
    
    const getStatusColor = (status: OrderStatus): string => {
        switch (status) {
          case 'Delivered': return 'text-green-600';
          case 'Out for Delivery': return 'text-blue-600';
          case 'Preparing': case 'Confirmed': return 'text-yellow-600';
          case 'Order Placed': return 'text-sky-600';
          case 'Accepted by Rider': return 'text-orange-600';
          case 'Cancelled': return 'text-red-600';
          case 'Expired': return 'text-gray-500';
          default: return 'text-orange-600';
        }
    };
    
    // --- DIALOG HANDLERS ---
    const handleOpenCancelDialog = (order: Order) => {
        if (order.status === 'Order Placed') {
            setOrderToCancel(order);
            setSelectedCancelReason('');
            setIsCancelDialogOpen(true);
        } else {
            toast({ title: 'Cancellation Not Allowed', description: 'This order can no longer be cancelled.', variant: 'destructive' });
        }
    };

    const handleConfirmCancellation = async () => {
        if (!orderToCancel || !selectedCancelReason) return;
        await cancelOrder(orderToCancel.id, selectedCancelReason);
        
        const isPrepaid = orderToCancel.paymentMethod === 'Razorpay';
        const refundMessage = isPrepaid ? ' Your refund will be processed within 24-48 hours.' : '';

        toast({
            title: 'Order Cancelled',
            description: `Order #${orderToCancel.id.slice(-6)} has been successfully cancelled.${refundMessage}`,
        });

        setIsCancelDialogOpen(false);
    };
    
    const handleOpenBillDialog = (order: Order) => {
        setOrderForBillView(order);
        setIsBillDialogOpen(true);
    };

    const calculateSubtotal = (items: OrderItem[]): number => {
      return (Array.isArray(items) ? items : []).reduce((sum: number, item: OrderItem) => sum + item.price * item.quantity, 0);
    };

    const handleOpenReviewDialog = (order: Order) => {
        setOrderToReview(order);
        setCurrentRating(order.review?.rating || 0);
        setCurrentReviewComment(order.review?.comment || '');
        setIsReviewDialogOpen(true);
    };

    const handleReviewSubmit = async () => {
        if (!orderToReview || currentRating === 0) return;
        const newReview: Review = { rating: currentRating, comment: currentReviewComment.trim() || undefined, date: new Date().toISOString().split('T')[0] };
        await submitOrderReview(orderToReview.id, newReview);
        toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
        setIsReviewDialogOpen(false);
    };


    if (isAuthLoading || isLoading) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="w-24 h-24 text-primary">
                <AnimatedPlateSpinner />
            </div>
            <p className="text-xl text-muted-foreground mt-4">
              {isAuthLoading ? "Verifying..." : "Fetching your orders..."}
            </p>
          </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Button variant="outline" onClick={() => trackedOrder ? handleBackToList() : router.push('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {trackedOrder ? 'Back to All Orders' : 'Back to Menu'}
            </Button>
            
            {trackedOrder ? (
                // --- TRACKING VIEW ---
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl md:text-2xl font-headline">Track Order: #{trackedOrder.id.toString().slice(-6)}</CardTitle>
                        <CardDescription>Current Status: <span className={cn("font-bold", getStatusColor(trackedOrder.status))}>{trackedOrder.status}</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                    {trackedOrder.deliveryRiderName && (
                        <Card className="mb-4 bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-3 text-primary">
                                    <Bike className="h-6 w-6"/>
                                    Your Rider is on the way!
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p className="flex items-center gap-2"><PersonStanding className="h-4 w-4 text-muted-foreground"/> <strong>Name:</strong> {trackedOrder.deliveryRiderName}</p>
                                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> <strong>Phone:</strong> <a href={`tel:${trackedOrder.deliveryRiderPhone}`} className="text-primary underline">{trackedOrder.deliveryRiderPhone}</a></p>
                                <p className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground"/> <strong>Vehicle:</strong> {trackedOrder.deliveryRiderVehicle}</p>
                            </CardContent>
                        </Card>
                    )}
                    {trackedOrder.status === 'Cancelled' || trackedOrder.status === 'Expired' ? (
                        <Card className="mt-4 border-destructive bg-destructive/10">
                            <CardHeader className="flex flex-row items-center space-x-3">
                                {trackedOrder.status === 'Cancelled' ? <AlertTriangle className="h-8 w-8 text-destructive" /> : <TimerOff className="h-8 w-8 text-destructive" />}
                                <div>
                                    <CardTitle className="text-destructive">Order {trackedOrder.status}</CardTitle>
                                    {trackedOrder.cancellationReason && <CardDescription>Reason: {trackedOrder.cancellationReason}</CardDescription>}
                                    {trackedOrder.status === 'Expired' && <CardDescription>The restaurant did not confirm your order in time.</CardDescription>}
                                </div>
                            </CardHeader>
                        </Card>
                    ) : (
                        <div className="relative pt-4 pl-4">
                            <div className="absolute left-9 top-4 bottom-0 w-0.5 bg-border -z-10" />
                            {orderProgressSteps.map((step, index) => {
                                const IconComponent = stepIcons[step as OrderStatus] || PackageSearch;
                                const currentIndex = orderProgressSteps.indexOf(trackedOrder.status);
                                const isCompleted = index < currentIndex;
                                const isActive = index === currentIndex;
                                
                                return (
                                <div key={step} className="flex items-start mb-6 last:mb-0">
                                    <div className={cn( "flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0", isActive ? "bg-primary border-primary text-primary-foreground animate-pulse" : isCompleted ? "bg-primary/80 border-primary/80 text-primary-foreground" : "bg-muted border-border text-muted-foreground" )}>
                                        <IconComponent className="h-5 w-5" />
                                    </div>
                                    <div className="ml-4 pt-1.5">
                                        <p className={cn( "font-medium", isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground" )}>
                                            {step}
                                        </p>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}

                    {trackedOrder.status !== 'Cancelled' && trackedOrder.status !== 'Expired' && trackedOrder.deliveryConfirmationCode && (
                        <>
                            <Separator className="my-4" />
                            <div className="p-4 border-dashed border-2 border-primary/50 rounded-lg text-center bg-primary/5">
                                <h3 className="font-semibold text-lg text-primary flex items-center justify-center">
                                    <ShieldCheck className="mr-2 h-5 w-5"/>
                                    Your Delivery Code
                                </h3>
                                <p className="text-4xl font-bold tracking-widest my-2">{trackedOrder.deliveryConfirmationCode}</p>
                                <p className="text-xs text-muted-foreground">Share this code with the delivery partner to complete your delivery.</p>
                            </div>
                        </>
                    )}
                    </CardContent>
                </Card>
            ) : (
                // --- ORDER LIST VIEW ---
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl md:text-2xl font-headline">My Orders</CardTitle>
                        <CardDescription>View your order history and track current orders.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {orders.length > 0 ? (
                           orders.map(order => (
                             <Card key={order.id} className="bg-muted/30">
                               <CardHeader>
                                 <div className="flex justify-between items-start">
                                   <div>
                                     <CardTitle className="text-lg">Order ID: #{order.id.toString().slice(-6)}</CardTitle>
                                     <CardDescription>Date: {new Date(order.date).toLocaleString()} | Status: <span className={`font-semibold ${getStatusColor(order.status)}`}>{order.status}</span></CardDescription>
                                   </div>
                                   <p className="text-lg font-semibold text-primary">Rs.{order.total.toFixed(2)}</p>
                                 </div>
                               </CardHeader>
                               <CardContent className="p-4 space-y-4">
                                  <div className="space-y-2">
                                      <p className="text-sm font-medium">Items:</p>
                                      <div className="pl-2 space-y-1">
                                          {(Array.isArray(order.items) ? order.items : []).map((item: OrderItem) => (
                                              <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                                                  <p>{item.name} &times; {item.quantity}</p>
                                                  <p>Rs.{(item.price * item.quantity).toFixed(2)}</p>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  
                                  {order.status !== 'Cancelled' && order.status !== 'Expired' && order.deliveryConfirmationCode && (
                                    <div className="p-3 border-dashed border-2 border-primary/50 rounded-lg text-center bg-primary/5">
                                      <h3 className="font-semibold text-sm text-primary flex items-center justify-center">
                                        <ShieldCheck className="mr-2 h-4 w-4"/>
                                        Delivery Code
                                      </h3>
                                      <p className="text-3xl font-bold tracking-widest my-1">{order.deliveryConfirmationCode}</p>
                                    </div>
                                  )}

                                  {order.review && (
                                    <div>
                                      <p className="text-sm font-medium">Your Review:</p>
                                      <div className="flex items-center mt-1">
                                        {[...Array(5)].map((_, i) => <Star key={i} className={cn("h-4 w-4", i < order.review!.rating ? "fill-accent text-accent" : "text-muted-foreground")} />)}
                                      </div>
                                      {order.review.comment && <p className="text-xs text-muted-foreground italic mt-1">"{order.review.comment}"</p>}
                                    </div>
                                  )}

                                  <Separator />

                                  <div className="flex flex-wrap gap-2">
                                     <Button variant="outline" size="sm" onClick={() => handleTrackOrderFromList(order)}><PackageSearch className="mr-2 h-4 w-4" />Track</Button>
                                     <Button variant="outline" size="sm" onClick={() => handleOpenBillDialog(order)}><FileText className="mr-2 h-4 w-4" />View Bill</Button>
                                     {order.status === 'Order Placed' && <Button variant="destructive" size="sm" onClick={() => handleOpenCancelDialog(order)}><Ban className="mr-2 h-4 w-4" />Cancel Order</Button>}
                                     {order.status === 'Delivered' && !order.review && <Button variant="default" size="sm" className="bg-accent hover:bg-accent/90" onClick={() => handleOpenReviewDialog(order)}><Star className="mr-2 h-4 w-4" />Leave Review</Button>}
                                  </div>
                                </CardContent>
                             </Card>
                           ))
                        ) : (
                           <div className="text-center py-10">
                             <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
                             <p className="mt-4 text-lg text-muted-foreground">You have no order history.</p>
                           </div>
                        )}
                    </CardContent>
                </Card>
            )}

             {/* Dialogs */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Cancellation</DialogTitle>
                    <DialogDescription>
                        Select a reason for cancelling order <span className="font-semibold">#{orderToCancel?.id.toString().slice(-6)}</span>.
                        {orderToCancel?.paymentMethod === 'Razorpay' && (
                            <p className="mt-2 text-sm text-primary">
                                As this was a prepaid order, your refund will be processed within 24-48 hours upon cancellation.
                            </p>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={selectedCancelReason} onValueChange={setSelectedCancelReason}>
                        <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                        <SelectContent>{CANCELLATION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>Keep Order</Button>
                    <Button variant="destructive" onClick={handleConfirmCancellation} disabled={!selectedCancelReason}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {orderForBillView && (
              <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    {orderForBillView && (
                        <>
                        <DialogHeader>
                            <DialogTitle>Bill for Order #{orderForBillView.id.toString().slice(-6)}</DialogTitle>
                            <DialogDescription>
                                Placed on {new Date(orderForBillView.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Items Ordered</h4>
                                <div className="space-y-2">
                                    {(Array.isArray(orderForBillView.items) ? orderForBillView.items : []).map((item: OrderItem) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <Image 
                                                    src={(item.imageUrl ?? 'https://placehold.co/40x40.png').split('?data-ai-hint=')[0].split('data-ai-hint=')[0]}
                                                    alt={item.name ?? 'Food item'} 
                                                    width={40} 
                                                    height={40} 
                                                    className="rounded-md object-cover" 
                                                    data-ai-hint={
                                                        item.imageUrl?.includes('data-ai-hint=')
                                                        ? item.imageUrl.split('data-ai-hint=')[1]
                                                        : `${item.name?.split(' ')[0].toLowerCase() || 'food'} ${item.category?.toLowerCase() || ''}`.trim()
                                                    }
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
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Order Summary</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>Rs.{calculateSubtotal(orderForBillView.items).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Delivery Fee:</span>
                                        <span>Rs.{(orderForBillView.deliveryFee ?? 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Taxes:</span>
                                        <span>Rs.{(orderForBillView.totalTax ?? (calculateSubtotal(orderForBillView.items) * (orderForBillView.taxRate ?? 0))).toFixed(2)}</span>
                                    </div>
                                    <Separator className="my-2"/>
                                    <div className="flex justify-between font-bold text-base mt-2">
                                        <span>Grand Total:</span>
                                        <span className="text-primary">Rs.{orderForBillView.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Payment Method:</span>
                                        <span className="flex items-center">
                                            {orderForBillView.paymentMethod === 'Razorpay' ? <CreditCard className="w-4 h-4 mr-1.5" /> : <QrCode className="w-4 h-4 mr-1.5" />}
                                            {orderForBillView.paymentMethod}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                        </>
                    )}
                </DialogContent>
              </Dialog>
            )}
            {orderToReview && (
              <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>Review Order #{orderToReview.id.toString().slice(-6)}</DialogTitle></DialogHeader><div className="py-4 space-y-4"><div className="flex space-x-1">{[1,2,3,4,5].map(v=><Star key={v} className={cn("h-8 w-8 cursor-pointer", v <= currentRating ? "fill-accent text-accent" : "text-muted-foreground")} onClick={() => setCurrentRating(v)} />)}</div><Textarea value={currentReviewComment} onChange={e=>setCurrentReviewComment(e.target.value)} placeholder="Comments..." /></div><DialogFooter><Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Cancel</Button><Button onClick={handleReviewSubmit} disabled={currentRating === 0}>Submit</Button></DialogFooter></DialogContent>
              </Dialog>
            )}
        </div>
    );
}
