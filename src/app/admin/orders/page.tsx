

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { Order, OrderItem, OrderStatus, PaymentSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { updateOrderStatus, listenToAllOrders, sendAdminMessage, deleteOrder, getPaymentSettings } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription as AlertDialogDescriptionElement,
    AlertDialogFooter,
  } from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, PackageSearch, Eye, PhoneCall, MessageSquare, Send, Search, Trash2, CreditCard, QrCode, Ban, ChevronRight, Bike } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import AnimatedPlateSpinner from "@/components/icons/AnimatedPlateSpinner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import DirectionsMap from "@/components/DirectionsMap";
import { cn } from "@/lib/utils";

const ORDER_PROGRESS_STEPS: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
];

const ALL_FILTER_STATUSES: (OrderStatus | 'All')[] = [
  'All',
  'Order Placed',
  'Confirmed',
  'Accepted by Rider',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function AdminOrdersPage() {
  const { isAdmin, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [orderToMessage, setOrderToMessage] = useState<Order | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'All'>('All');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !isAdmin) {
        router.replace("/");
        return;
    }

    setIsDataLoading(true);
    const unsubscribe = listenToAllOrders((allOrders) => {
        setOrders(allOrders);
        setIsDataLoading(false);
    });
    
    getPaymentSettings().then(setPaymentSettings);

    return () => unsubscribe();
  }, [isAdmin, isAuthLoading, isAuthenticated, router, toast]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        if (filterStatus === 'All') return true;
        return order.status === filterStatus;
      })
      .filter(order => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return (
          order.id.slice(-6).toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term) ||
          order.userEmail.toLowerCase().includes(term)
        );
      });
  }, [orders, searchTerm, filterStatus]);
  
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
  
  const handleProgressOrder = async (order: Order) => {
    const currentIndex = ORDER_PROGRESS_STEPS.indexOf(order.status);
    if (currentIndex === -1 || currentIndex >= ORDER_PROGRESS_STEPS.length - 1) {
      return; // Cannot progress 'Delivered' or 'Cancelled' orders
    }
    const nextStatus = ORDER_PROGRESS_STEPS[currentIndex + 1];
    
    try {
      await updateOrderStatus(order.id, nextStatus);
      toast({
        title: 'Order Status Updated',
        description: `Order #${order.id.slice(-6)} is now marked as ${nextStatus}.`,
      });
    } catch (error) {
      console.error("Failed to update order status", error);
      toast({ title: "Update Failed", description: "Could not update the order status.", variant: "destructive" });
    }
  };

  const handleOpenMessageDialog = (order: Order) => {
    setOrderToMessage(order);
    setMessageContent('');
    setIsMessageDialogOpen(true);
  };

  const handleOpenCancelDialog = (order: Order) => {
    setOrderToCancel(order);
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (orderToCancel) {
      try {
        await updateOrderStatus(orderToCancel.id, 'Cancelled');
        toast({ title: "Order Cancelled", description: `Order #${orderToCancel.id.slice(-6)} has been cancelled.`});
      } catch (error) {
        console.error("Failed to cancel order", error);
        toast({ title: "Cancellation Failed", description: "Could not cancel the order.", variant: "destructive" });
      }
    }
    setIsCancelDialogOpen(false);
    setOrderToCancel(null);
  };

  const handleDelete = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
        try {
            await deleteOrder(orderToDelete.id);
            toast({ title: "Order Deleted", description: `Order #${orderToDelete.id.slice(-6)} has been removed.`});
        } catch (error) {
            console.error("Failed to delete order", error);
            toast({ title: "Delete Failed", description: "Could not delete the order.", variant: "destructive" });
        }
    }
    setIsDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const handleSendMessage = async () => {
    if (!orderToMessage || !messageContent.trim()) {
        toast({ title: "Message is empty", variant: "destructive" });
        return;
    }
    setIsSendingMessage(true);
    try {
        let title;
        if (orderToMessage.items && orderToMessage.items.length > 0) {
            const mainItemName = orderToMessage.items[0].name;
            const moreItemsText = orderToMessage.items.length > 1 ? ' and more' : '';
            title = `Re: Your order for ${mainItemName}${moreItemsText} (#${orderToMessage.id.slice(-6)})`;
        } else {
            title = `A message regarding your order #${orderToMessage.id.slice(-6)}`;
        }
        await sendAdminMessage(orderToMessage.userId, orderToMessage.userEmail, title, messageContent);
        toast({ title: "Message Sent!", description: `Your message has been sent to ${orderToMessage.customerName}.` });
        setIsMessageDialogOpen(false);
    } catch (error) {
        console.error("Failed to send message:", error);
        toast({ title: "Failed to Send", description: "An error occurred while sending the message.", variant: "destructive" });
    } finally {
        setIsSendingMessage(false);
    }
  };


  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          {isAuthLoading ? "Verifying access..." : "Loading orders..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <ClipboardList className="mr-3 h-6 w-6 text-primary" /> All Customer Orders
          </CardTitle>
          <CardDescription>
            View and manage all orders placed in the application. Updates happen in real-time.
          </CardDescription>
            <div className="flex items-center gap-4 pt-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as OrderStatus | 'All')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_FILTER_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="w-[200px]">Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                    const currentStatusIndex = ORDER_PROGRESS_STEPS.indexOf(order.status);
                    const canProgress = currentStatusIndex !== -1 && currentStatusIndex < ORDER_PROGRESS_STEPS.length - 1;
                    const nextStatus = canProgress ? ORDER_PROGRESS_STEPS[currentStatusIndex + 1] : '';

                    return (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{new Date(order.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant={getStatusVariant(order.status)} className="w-fit">{order.status}</Badge>
                                    {canProgress && (
                                        <Button size="sm" variant="outline" onClick={() => handleProgressOrder(order)}>
                                           Next: {nextStatus} <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">Rs.{order.total.toFixed(2)}</TableCell>
                            <TableCell>
                                <div className="flex justify-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setSelectedOrder(order)}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View Details</span>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleOpenCancelDialog(order)} disabled={order.status === 'Cancelled' || order.status === 'Delivered'}>
                                        <Ban className="h-4 w-4" />
                                        <span className="sr-only">Cancel Order</span>
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(order)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete Order</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    {orders.length === 0 ? "No orders have been placed yet." : "No orders match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => { if (!isOpen) setSelectedOrder(null) }}>
        <DialogContent className="sm:max-w-lg">
            {selectedOrder && (
                <>
                <DialogHeader>
                    <DialogTitle>Order Details: #{selectedOrder.id.slice(-6)}</DialogTitle>
                    <DialogDescription>
                        Placed by {selectedOrder.customerName} ({selectedOrder.userEmail}) on {new Date(selectedOrder.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                        <div>
                        <h4 className="font-semibold mb-2 text-sm">Items Ordered</h4>
                        <div className="space-y-2">
                            {selectedOrder.items.map((item: OrderItem) => (
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
                                <span>Status:</span>
                                <Badge variant={getStatusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment Method:</span>
                                <span className="flex items-center">
                                    {selectedOrder.paymentMethod === 'Razorpay' && <CreditCard className="w-4 h-4 mr-1.5"/>}
                                    {selectedOrder.paymentMethod === 'Cash on Delivery' && <QrCode className="w-4 h-4 mr-1.5"/>}
                                    {selectedOrder.paymentMethod}
                                </span>
                            </div>
                            <div className="flex justify-between font-bold text-base mt-2">
                                <span>Grand Total:</span>
                                <span className="text-primary">Rs.{selectedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    {selectedOrder.deliveryRiderName && (
                        <>
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Assigned Rider</h4>
                                <p className="text-sm flex items-center gap-2">
                                    <Bike className="h-4 w-4 text-primary" />
                                    {selectedOrder.deliveryRiderName}
                                </p>
                            </div>
                            <Separator />
                        </>
                    )}
                    <div>
                        <h4 className="font-semibold mb-2 text-sm">Shipping & Contact</h4>
                        <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
                        
                        {selectedOrder.customerPhone ? (
                            <div className="mt-3 flex items-center justify-between rounded-md border p-3">
                                <p className="text-sm text-muted-foreground">
                                    <PhoneCall className="inline-block mr-2 h-4 w-4 align-text-bottom" />
                                    {selectedOrder.customerPhone}
                                </p>
                                <Button asChild size="sm">
                                    <a href={`tel:${selectedOrder.customerPhone}`}>
                                        Call Now
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-muted-foreground">No contact phone provided.</p>
                        )}
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => handleOpenMessageDialog(selectedOrder)}
                         >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message Customer
                        </Button>
                    </div>
                    {paymentSettings && (
                        <>
                           <Separator />
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Directions to Customer</h4>
                                <DirectionsMap
                                    destinationCoords={
                                        selectedOrder.shippingLat && selectedOrder.shippingLng
                                        ? { lat: selectedOrder.shippingLat, lng: selectedOrder.shippingLng }
                                        : undefined
                                    }
                                    destinationAddress={selectedOrder.shippingAddress}
                                    apiUrl={paymentSettings.mapApiUrl}
                                    useLiveLocationForOrigin={false}
                                />
                            </div>
                        </>
                    )}
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Send Message to {orderToMessage?.customerName}</DialogTitle>
                <DialogDescription>
                    Regarding Order #{orderToMessage?.id.slice(-6)}. The user will receive this as a notification.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message here..."
                    rows={6}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" disabled={isSendingMessage}>Cancel</Button></DialogClose>
                <Button onClick={handleSendMessage} disabled={isSendingMessage || !messageContent.trim()}>
                    {isSendingMessage ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <Send className="mr-2 h-4 w-4"/>}
                    {isSendingMessage ? 'Sending...' : 'Send Message'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
            <AlertDialogDescriptionElement>
                This action will mark order
                <span className="font-semibold"> #{orderToCancel?.id.slice(-6)} </span>
                as 'Cancelled'. This cannot be undone.
            </AlertDialogDescriptionElement>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToCancel(null)}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive hover:bg-destructive/90">
                Yes, Cancel Order
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescriptionElement>
                This action cannot be undone. This will permanently delete the order
                <span className="font-semibold"> #{orderToDelete?.id.slice(-6)} </span>
                from the database.
            </AlertDialogDescriptionElement>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
