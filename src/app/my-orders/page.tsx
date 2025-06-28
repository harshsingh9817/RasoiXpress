
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, PackageSearch, Eye, ListOrdered, Calendar } from 'lucide-react';
import type { Order, OrderItem, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getUserOrders } from '@/lib/data';
import Image from 'next/image';

const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');

  const loadUserOrders = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
      const allUserOrders = await getUserOrders(user.uid);
      const sortedOrders = allUserOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Failed to load user orders:", error);
      toast({ title: "Error", description: "Could not load your order history.", variant: "destructive" });
    } finally {
      setIsDataLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserOrders();
    }
  }, [isAuthenticated, user, loadUserOrders]);

  const filteredOrders = orders.filter(order => {
    if (viewMode === 'all') return true;
    const today = new Date().toDateString();
    return new Date(order.date).toDateString() === today;
  });

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading ? "Verifying..." : "Loading your orders..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-headline flex items-center">
                    <ListOrdered className="mr-3 h-6 w-6 text-primary" /> My Orders
                </CardTitle>
                <CardDescription>
                    {viewMode === 'today' ? "Your orders from today." : "Your complete order history."}
                </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setViewMode(prev => prev === 'today' ? 'all' : 'today')}>
                <Calendar className="mr-2 h-4 w-4" />
                {viewMode === 'today' ? 'View All Orders' : "View Today's Orders"}
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <Card key={order.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-lg">Order #{order.id.slice(-6)}</p>
                    <p className="font-semibold text-primary text-lg">Rs.{order.total.toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.date).toLocaleString()}
                  </p>
                  <Badge variant={getStatusVariant(order.status)} className="mt-2">{order.status}</Badge>
                </div>
                <div className="flex gap-2 items-center self-end sm:self-center">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/profile#track-order-${order.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Track / Details
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-lg text-muted-foreground">
                {viewMode === 'today' ? "You haven't placed any orders today." : "You have no order history."}
              </p>
              {viewMode === 'today' && (
                <p className="text-sm text-muted-foreground">
                    Try the "View All Orders" button to see your past orders.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
