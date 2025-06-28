
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, LogOut, PackageSearch, Eye, ClipboardList } from 'lucide-react';
import type { Order, OrderStatus, OrderItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAllOrders } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

export default function RiderProfilePage() {
  const router = useRouter();
  const { user: firebaseUser, isDelivery, isLoading: isAuthLoading, logout } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadRiderData = useCallback(async () => {
    if (!firebaseUser) return;
    setIsDataLoading(true);
    try {
      const allOrders = await getAllOrders();
      const relevantStatuses: OrderStatus[] = ['Delivered', 'Cancelled', 'Out for Delivery', 'Shipped'];
      const riderOrders = allOrders.filter(o => relevantStatuses.includes(o.status));
      const sortedOrders = riderOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Failed to load rider data:", error);
      toast({ title: "Error", description: "Could not load your delivery history.", variant: "destructive" });
    } finally {
      setIsDataLoading(false);
    }
  }, [firebaseUser, toast]);

  useEffect(() => {
    if (!isAuthLoading && !isDelivery) {
      router.replace('/delivery/login');
    }
  }, [isDelivery, isAuthLoading, router]);

  useEffect(() => {
    if (isDelivery && firebaseUser) {
      loadRiderData();
    }
  }, [isDelivery, firebaseUser, loadRiderData]);

  const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading ? "Verifying..." : "Loading data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-8 p-6 bg-primary/5 rounded-xl shadow-xl border border-primary/20">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/30 shadow-lg">
          <AvatarFallback className="text-4xl">
            {firebaseUser?.displayName?.charAt(0).toUpperCase() || firebaseUser?.email?.charAt(0).toUpperCase() || 'R'}
          </AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-1">
            {firebaseUser?.displayName || 'Delivery Partner'}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">{firebaseUser?.email}</p>
          <Button variant="outline" onClick={logout} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-headline flex items-center">
             <ClipboardList className="mr-3 h-6 w-6 text-primary" /> Delivery History
          </CardTitle>
          <CardDescription>A log of your completed and past deliveries.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {orders.map(order => (
                <div key={order.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
                  <div>
                    <p className="font-semibold">Order #{order.id.slice(-6)}</p>
                    <p className="text-sm text-muted-foreground">
                      To: {order.customerName} on {new Date(order.date).toLocaleDateString()}
                    </p>
                    <Badge variant={getStatusVariant(order.status)} className="mt-1">{order.status}</Badge>
                  </div>
                  <div className="flex gap-2 items-center mt-3 sm:mt-0">
                    <p className="font-semibold text-primary">Rs.{order.total.toFixed(2)}</p>
                    <Button variant="outline" size="icon" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-lg text-muted-foreground">No delivery history yet.</p>
              <p className="text-sm text-muted-foreground">Completed deliveries will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => { if (!isOpen) setSelectedOrder(null) }}>
        <DialogContent className="sm:max-w-lg">
            {selectedOrder && (
                <>
                <DialogHeader>
                    <DialogTitle>Order Details: #{selectedOrder.id.slice(-6)}</DialogTitle>
                    <DialogDescription>
                        For {selectedOrder.customerName} on {new Date(selectedOrder.date).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                    <p className="text-sm"><span className="font-semibold">Address:</span> {selectedOrder.shippingAddress}</p>
                    <p className="text-sm"><span className="font-semibold">Phone:</span> {selectedOrder.customerPhone || 'N/A'}</p>
                    <p className="text-sm"><span className="font-semibold">Total:</span> Rs.{selectedOrder.total.toFixed(2)}</p>
                    <Separator />
                    <h4 className="font-semibold mb-2 text-sm">Items Ordered</h4>
                    <div className="space-y-2">
                        {selectedOrder.items.map((item: OrderItem) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                                <p>{item.name} x {item.quantity}</p>
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
