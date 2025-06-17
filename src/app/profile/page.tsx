
"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CartSheet from '@/components/CartSheet';
import {
  ListOrdered, MapPin, PackageSearch, Settings, User, Edit3, Trash2, PlusCircle, Loader2, LogOut,
  PackagePlus, ClipboardCheck, ChefHat, Truck, Bike, PackageCheck as PackageCheckIcon, AlertTriangle, XCircle
} from 'lucide-react';
import Image from 'next/image';
import type { Order, OrderItem, Address as AddressType, OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const orderProgressSteps: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const stepIcons: Record<OrderStatus, React.ElementType> = {
  'Order Placed': PackagePlus,
  'Confirmed': ClipboardCheck,
  'Preparing': ChefHat,
  'Shipped': Truck,
  'Out for Delivery': Bike,
  'Delivered': PackageCheckIcon,
  'Cancelled': XCircle,
};


const initialMockOrders: Order[] = [
  {
    id: 'ORD12345',
    date: '2024-07-15',
    status: 'Delivered',
    total: 45.99,
    items: [
      { id: 'm1', name: 'Margherita Pizza', quantity: 1, price: 12.99, imageUrl: 'https://placehold.co/100x100.png', category: 'Pizza', description: 'Classic pizza' },
      { id: 'm3', name: 'Chicken Burger', quantity: 2, price: 8.75, imageUrl: 'https://placehold.co/100x100.png', category: 'Burgers', description: 'Juicy burger' },
    ],
    shippingAddress: '123 Main St, Anytown, USA',
  },
  {
    id: 'ORD67890',
    date: '2024-07-20',
    status: 'Preparing', // Changed from 'Processing'
    total: 22.50,
    items: [
      { id: 'm8', name: 'Butter Chicken', quantity: 1, price: 16.00, imageUrl: 'https://placehold.co/100x100.png', category: 'Indian', description: 'Creamy chicken' },
      { id: 'm10', name: 'French Fries', quantity: 1, price: 4.00, imageUrl: 'https://placehold.co/100x100.png', category: 'Sides', description: 'Crispy fries' },
    ],
    shippingAddress: '123 Main St, Anytown, USA',
  },
   {
    id: 'ORD11223',
    date: '2024-07-22',
    status: 'Shipped',
    total: 30.00,
    items: [ { id: 'm6', name: 'Spaghetti Carbonara', quantity: 1, price: 14.00, imageUrl: 'https://placehold.co/100x100.png', category: 'Pasta', description: 'Creamy pasta' }],
    shippingAddress: '456 Oak Ave, Anytown, USA',
  },
  {
    id: 'ORDCANCELED',
    date: '2024-07-21',
    status: 'Cancelled',
    total: 15.00,
    items: [{ id: 'm5', name: 'Caesar Salad', quantity: 1, price: 9.20, imageUrl: 'https://placehold.co/100x100.png', category: 'Salads', description: 'Crisp salad' }],
    shippingAddress: '789 Pine Ln, Anytown, USA',
  }
];

const mockAddresses: AddressType[] = [
  { id: 'addr1', type: 'Home', street: '123 Main St', city: 'Foodville', postalCode: '12345', isDefault: true },
  { id: 'addr2', type: 'Work', street: '456 Business Ave', city: 'Workville', postalCode: '67890', isDefault: false },
];


export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('orders');
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedOrderDetails, setTrackedOrderDetails] = useState<Order | null>(null);
  const [trackOrderError, setTrackOrderError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<AddressType[]>(mockAddresses);
  const [isClientRendered, setIsClientRendered] = useState(false);

  useEffect(() => {
    setIsClientRendered(true);
    if (typeof window !== 'undefined') {
      const storedOrdersString = localStorage.getItem('nibbleNowUserOrders');
      let loadedOrders: Order[] = initialMockOrders;
      if (storedOrdersString) {
        try {
          const parsedOrders = JSON.parse(storedOrdersString) as Order[];
          if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
            loadedOrders = parsedOrders;
          }
        } catch (e) {
          console.error("Failed to parse orders from localStorage", e);
        }
      }

      const ordersWithHints = loadedOrders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          imageUrl: item.imageUrl.includes('data-ai-hint')
            ? item.imageUrl
            : `${item.imageUrl.split('?')[0]}?data-ai-hint=${item.name.split(" ")[0].toLowerCase()} ${item.category?.toLowerCase() || 'food'}`
        }))
      }));
      setOrders(ordersWithHints);
    }
  }, []);

  useEffect(() => {
    if (isClientRendered && !isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isClientRendered, isAuthenticated, isAuthLoading, router]);

  const findAndDisplayOrderStatus = (idToTrack: string) => {
    setTrackedOrderDetails(null);
    setTrackOrderError(null);

    if (!idToTrack) {
      setTrackOrderError('Please enter an order ID.');
      return;
    }

    // Simulate API call for status
    setTimeout(() => {
      const foundOrder = orders.find(o => o.id.toLowerCase() === idToTrack.toLowerCase());
      if (foundOrder) {
        setTrackedOrderDetails(foundOrder);
      } else {
        setTrackOrderError(`Order ${idToTrack} not found.`);
      }
    }, 1000);
  };

  const handleTrackOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    findAndDisplayOrderStatus(trackOrderId);
  };

  const handleTrackOrderFromList = (orderIdToList: string) => {
    setActiveTab('track');
    setTrackOrderId(orderIdToList);
    findAndDisplayOrderStatus(orderIdToList);
  };
  
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'Delivered': return 'text-green-600';
      case 'Shipped':
      case 'Out for Delivery': return 'text-blue-600';
      case 'Preparing':
      case 'Confirmed': return 'text-yellow-600';
      case 'Order Placed': return 'text-sky-600';
      case 'Cancelled': return 'text-red-600';
      default: return 'text-orange-600'; // Default for Processing or others
    }
  };


  if (!isClientRendered || isAuthLoading || (!isAuthenticated && isClientRendered)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading || !isClientRendered ? "Loading profile..." : "Redirecting to login..."}
        </p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                          <CardDescription>Date: {order.date} | Status: <span className={`font-semibold ${getStatusColor(order.status)}`}>{order.status}</span></CardDescription>
                        </div>
                        <p className="text-lg font-semibold text-primary">${order.total.toFixed(2)}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm font-medium">Items:</p>
                      <ul className="space-y-1">
                        {order.items.map(item => (
                          <li key={item.id + item.name} className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Image
                                src={item.imageUrl.includes('data-ai-hint') ? item.imageUrl.split('?data-ai-hint=')[0] : item.imageUrl.split('data-ai-hint=')[0]}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded mr-2"
                                data-ai-hint={item.imageUrl.includes('data-ai-hint=') ? item.imageUrl.split('data-ai-hint=')[1] : `${item.name.split(" ")[0].toLowerCase()} ${item.category?.toLowerCase() || 'food'}`}
                              />
                              <span>{item.name} (x{item.quantity})</span>
                            </div>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-muted-foreground pt-1">Shipped to: {order.shippingAddress}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full sm:w-auto"
                        onClick={() => handleTrackOrderFromList(order.id)}
                      >
                        <PackageSearch className="mr-2 h-4 w-4" />
                        Track this Order
                      </Button>
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
              <CardDescription>Enter your order ID to see its current status and progress.</CardDescription>
            </CardHeader>
            <form onSubmit={handleTrackOrderSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="e.g., ORD12345"
                    value={trackOrderId}
                    onChange={(e) => {
                      setTrackOrderId(e.target.value);
                      setTrackedOrderDetails(null); // Clear previous details when ID changes
                      setTrackOrderError(null);
                    }}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  <PackageSearch className="mr-2 h-4 w-4" /> Track Order
                </Button>
              </CardContent>
            </form>
            <CardContent>
              {trackOrderError && (
                <p className="text-destructive text-center py-4">{trackOrderError}</p>
              )}
              {trackedOrderDetails && trackedOrderDetails.status === 'Cancelled' && (
                 <Card className="mt-4 border-destructive bg-destructive/10">
                    <CardHeader className="flex flex-row items-center space-x-3">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                        <div>
                            <CardTitle className="text-destructive">Order Cancelled</CardTitle>
                            <CardDescription>Order ID: {trackedOrderDetails.id} was cancelled.</CardDescription>
                        </div>
                    </CardHeader>
                 </Card>
              )}
              {trackedOrderDetails && trackedOrderDetails.status !== 'Cancelled' && (
                <div className="mt-6 space-y-6">
                  <div>
                     <h3 className="text-lg font-semibold mb-1">Order ID: {trackedOrderDetails.id}</h3>
                     <p className="text-sm text-muted-foreground">Current Status: <span className={cn("font-bold", getStatusColor(trackedOrderDetails.status))}>{trackedOrderDetails.status}</span></p>
                  </div>
                  <div className="relative pt-2">
                    {/* Progress line */}
                    <div className="absolute left-5 top-2 bottom-0 w-0.5 bg-border -z-10" />

                    {orderProgressSteps.map((step, index) => {
                      const IconComponent = stepIcons[step as OrderStatus] || PackageSearch;
                      const currentIndex = orderProgressSteps.indexOf(trackedOrderDetails.status);
                      const isCompleted = index < currentIndex;
                      const isActive = index === currentIndex;
                      const isFuture = index > currentIndex;

                      return (
                        <div key={step} className="flex items-start mb-5 last:mb-0">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0",
                            isActive ? "bg-primary border-primary text-primary-foreground animate-pulse" : "",
                            isCompleted ? "bg-primary/80 border-primary/80 text-primary-foreground" : "",
                            isFuture ? "bg-muted border-border text-muted-foreground" : ""
                          )}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="ml-4 pt-1.5">
                            <p className={cn(
                              "font-medium",
                              isActive ? "text-primary" : "",
                              isCompleted ? "text-foreground" : "",
                              isFuture ? "text-muted-foreground" : ""
                            )}>{step}</p>
                            {isActive && <p className="text-xs text-muted-foreground">This is the current step.</p>}
                            {isCompleted && <p className="text-xs text-muted-foreground">Completed</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Account Settings</CardTitle>
              <CardDescription>Manage your account preferences and logout.</CardDescription>
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
              <Separator />
              <div>
                <Button variant="destructive" onClick={logout} className="w-full sm:w-auto">
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <CartSheet />
    </div>
  );
}
