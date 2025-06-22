
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/lib/data";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, PackageSearch, Eye } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const ALL_ORDER_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Shipped',
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

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/");
    }
  }, [isAdmin, isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const q = query(collection(db, "orders"), orderBy("date", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
        setIsDataLoading(false);
      }, (error) => {
        console.error("Error fetching orders in real-time:", error);
        toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
        setIsDataLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on component unmount
    }
  }, [isAuthenticated, isAdmin, toast]);
  
  const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'Delivered':
      case 'Out for Delivery':
      case 'Shipped':
        return 'default'; // This is primary color in badge variants
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Order Status Updated',
        description: `Order #${orderId.slice(-6)} is now marked as ${newStatus}.`,
      });
    } catch (error) {
      console.error("Failed to update order status", error);
      toast({
        title: "Update Failed",
        description: "Could not update the order status.",
        variant: "destructive",
      });
    }
  };


  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
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
            View and manage all orders placed in the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[200px]">Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(-6)}</TableCell>
                    <TableCell>{order.userEmail}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                       <Select
                         value={order.status}
                         onValueChange={(newStatus: OrderStatus) => handleStatusChange(order.id, newStatus)}
                       >
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Update status" />
                         </SelectTrigger>
                         <SelectContent>
                           {ALL_ORDER_STATUSES.map(status => (
                             <SelectItem key={status} value={status}>{status}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell className="text-right">Rs.{order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                       <Button variant="outline" size="icon" onClick={() => setSelectedOrder(order)}>
                           <Eye className="h-4 w-4" />
                           <span className="sr-only">View Details</span>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                    No orders have been placed yet.
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
                        Placed by {selectedOrder.userEmail} on {new Date(selectedOrder.date).toLocaleDateString()}
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
                                            src={item.imageUrl.includes('data-ai-hint') ? item.imageUrl.split('?data-ai-hint=')[0] : item.imageUrl.split('data-ai-hint=')[0]}
                                            alt={item.name} 
                                            width={40} 
                                            height={40} 
                                            className="rounded-md object-cover" 
                                            data-ai-hint={item.imageUrl.includes('data-ai-hint=') ? item.imageUrl.split('data-ai-hint=')[1] : `${item.name.split(" ")[0].toLowerCase()} ${item.category?.toLowerCase() || 'food'}`}
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
                                <span>{selectedOrder.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base mt-2">
                                <span>Grand Total:</span>
                                <span className="text-primary">Rs.{selectedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold mb-2 text-sm">Shipping Information</h4>
                        <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
                        <p className="text-sm text-muted-foreground">Contact: {selectedOrder.customerPhone || 'N/A'}</p>
                    </div>
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
