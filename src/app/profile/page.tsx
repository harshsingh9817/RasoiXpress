
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import CartItemCard from '@/components/CartItemCard';
import CartSheet from '@/components/CartSheet';
import { ListOrdered, MapPin, PackageSearch, Settings, User, ShoppingBag, Edit3, Trash2, PlusCircle } from 'lucide-react';
import Image from 'next/image';

// Mock data types (can be moved to lib/types.ts later)
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

interface Order {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: OrderItem[];
  shippingAddress: string;
}

interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

const mockOrders: Order[] = [
  {
    id: 'ORD12345',
    date: '2024-07-15',
    status: 'Delivered',
    total: 45.99,
    items: [
      { id: 'm1', name: 'Margherita Pizza', quantity: 1, price: 12.99, imageUrl: 'https://placehold.co/100x100.png' },
      { id: 'm3', name: 'Chicken Burger', quantity: 2, price: 8.75, imageUrl: 'https://placehold.co/100x100.png' },
    ],
    shippingAddress: '123 Main St, Anytown, USA',
  },
  {
    id: 'ORD67890',
    date: '2024-07-20',
    status: 'Processing',
    total: 22.50,
    items: [
      { id: 'm8', name: 'Butter Chicken', quantity: 1, price: 16.00, imageUrl: 'https://placehold.co/100x100.png' },
      { id: 'm10', name: 'French Fries', quantity: 1, price: 4.00, imageUrl: 'https://placehold.co/100x100.png' },
    ],
    shippingAddress: '123 Main St, Anytown, USA',
  },
];

const mockAddresses: Address[] = [
  { id: 'addr1', type: 'Home', street: '123 Main St', city: 'Foodville', postalCode: '12345', isDefault: true },
  { id: 'addr2', type: 'Work', street: '456 Business Ave', city: 'Workville', postalCode: '67890', isDefault: false },
];


export default function ProfilePage() {
  const { cartItems, getCartTotal, clearCart: clearCartContext, setIsCartOpen } = useCart();
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedOrderStatus, setTrackedOrderStatus] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId) {
      setTrackedOrderStatus('Please enter an order ID.');
      return;
    }
    // Simulate API call
    setTrackedOrderStatus(`Searching for order ${trackOrderId}...`);
    setTimeout(() => {
      const foundOrder = orders.find(o => o.id === trackOrderId);
      if (foundOrder) {
        setTrackedOrderStatus(`Order ${trackOrderId} is currently ${foundOrder.status}.`);
      } else {
        setTrackedOrderStatus(`Order ${trackOrderId} not found.`);
      }
    }, 1500);
  };

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <User className="h-16 w-16 text-primary animate-pulse" />
        <p className="mt-4 text-xl text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section className="text-center md:text-left">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2 flex items-center justify-center md:justify-start">
          <User className="mr-3 h-10 w-10" /> My Profile
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your orders, addresses, and account settings.
        </p>
      </section>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="orders"><ListOrdered className="mr-2 h-4 w-4 sm:hidden md:inline-block" />My Orders</TabsTrigger>
          <TabsTrigger value="addresses"><MapPin className="mr-2 h-4 w-4 sm:hidden md:inline-block" />My Addresses</TabsTrigger>
          <TabsTrigger value="track"><PackageSearch className="mr-2 h-4 w-4 sm:hidden md:inline-block" />Track Order</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4 sm:hidden md:inline-block" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Order History</CardTitle>
              <CardDescription>Review your past and current orders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {orders.length > 0 ? (
                orders.map(order => (
                  <Card key={order.id} className="bg-muted/30">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Order ID: {order.id}</CardTitle>
                          <CardDescription>Date: {order.date} | Status: <span className={`font-semibold ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Processing' ? 'text-blue-600' : 'text-orange-600'}`}>{order.status}</span></CardDescription>
                        </div>
                        <p className="text-lg font-semibold text-primary">${order.total.toFixed(2)}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm font-medium">Items:</p>
                      <ul className="space-y-1">
                        {order.items.map(item => (
                          <li key={item.id} className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded mr-2" data-ai-hint="food item" />
                              <span>{item.name} (x{item.quantity})</span>
                            </div>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                       <p className="text-sm text-muted-foreground pt-1">Shipped to: {order.shippingAddress}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">You have no orders yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">My Addresses</CardTitle>
              <CardDescription>Manage your saved shipping addresses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.map(address => (
                <Card key={address.id} className={`p-4 ${address.isDefault ? 'border-primary' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{address.type} Address {address.isDefault && <span className="text-xs text-primary font-bold">(Default)</span>}</h4>
                      <p className="text-sm text-muted-foreground">{address.street}, {address.city}, {address.postalCode}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" aria-label="Edit address"><Edit3 className="h-4 w-4" /></Button>
                      {!address.isDefault && <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete address"><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                  {!address.isDefault && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary">Set as default</Button>
                  )}
                </Card>
              ))}
              <Button variant="outline" className="w-full mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="track">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Track Your Order</CardTitle>
              <CardDescription>Enter your order ID to see its current status.</CardDescription>
            </CardHeader>
            <form onSubmit={handleTrackOrder}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input 
                    id="orderId" 
                    placeholder="e.g., ORD12345" 
                    value={trackOrderId}
                    onChange={(e) => setTrackOrderId(e.target.value)}
                  />
                </div>
                {trackedOrderStatus && (
                  <p className={`text-sm ${trackedOrderStatus.includes('not found') ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {trackedOrderStatus}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <PackageSearch className="mr-2 h-4 w-4" /> Track Order
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Account Settings</CardTitle>
              <CardDescription>Manage your account preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="user@example.com" disabled />
                <Button variant="outline" size="sm" className="mt-1">Update Email</Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground">********</p>
                <Button variant="outline" size="sm" className="mt-1">Change Password</Button>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Notification Preferences</h4>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Input type="checkbox" id="promoEmails" defaultChecked />
                        <Label htmlFor="promoEmails" className="font-normal">Receive promotional emails</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Input type="checkbox" id="orderUpdates" defaultChecked />
                        <Label htmlFor="orderUpdates" className="font-normal">Get order status updates</Label>
                    </div>
                </div>
                 <Button variant="default" size="sm" className="mt-3 bg-primary hover:bg-primary/90">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <CartSheet />
    </div>
  );
}
