
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CartItemCard from '@/components/CartItemCard';
import CartSheet from '@/components/CartSheet';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Home, Loader2, PackageCheck } from 'lucide-react';
import type { Order, OrderItem } from '@/lib/types'; // Assuming types are in lib/types

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart, getCartItemCount } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  useEffect(() => {
    setIsClient(true);
    if (getCartItemCount() === 0) {
      router.replace('/');
    }
  }, [getCartItemCount, router]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create the order object
    const newOrder: Order = {
      id: `ORD${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      status: 'Processing',
      total: getCartTotal() + 2.99 + (getCartTotal() * 0.08), // Including fees and tax as displayed
      items: cartItems.map(item => ({
        id: item.id, // This is the menu item id
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl, // imageUrl from CartItem
        category: item.category, // Added category from MenuItem
        description: item.description, // Added description from MenuItem
      })),
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
    };

    // Save order to localStorage
    if (typeof window !== 'undefined') {
      const existingOrdersString = localStorage.getItem('nibbleNowUserOrders');
      let orders: Order[] = [];
      if (existingOrdersString) {
        try {
          orders = JSON.parse(existingOrdersString);
        } catch (e) {
          console.error("Failed to parse orders from localStorage", e);
          orders = []; // Reset if parsing fails
        }
      }
      orders.unshift(newOrder); // Add new order to the beginning
      localStorage.setItem('nibbleNowUserOrders', JSON.stringify(orders));
    }

    toast({
      title: 'Order Placed Successfully!',
      description: 'Thank you for your order. We will process it shortly.',
      variant: 'default',
      duration: 5000,
    });
    clearCart();
    router.push('/profile'); // Redirect to profile to see the new order
    setIsLoading(false);
  };

  if (!isClient || getCartItemCount() === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {getCartItemCount() === 0 ? "Redirecting to homepage..." : "Loading checkout..."}
        </p>
      </div>
    );
  }

  const subTotal = getCartTotal();
  const deliveryFee = 2.99;
  const estimatedTax = subTotal * 0.08;
  const grandTotal = subTotal + deliveryFee + estimatedTax;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Checkout</h1>
        <p className="text-lg text-muted-foreground">
          Almost there! Please review your order and provide your details.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Shipping & Payment</CardTitle>
            <CardDescription>Enter your shipping address and payment details.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitOrder}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Main St" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="Foodville" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="12345" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="(555) 123-4567" required />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-lg font-medium">Payment Details</Label>
                <div className="p-4 border rounded-md bg-muted/50 text-muted-foreground text-center">
                  <CreditCard className="mx-auto h-8 w-8 mb-2 text-primary" />
                  <p>Secure payment processing coming soon!</p>
                  <p className="text-xs">(For now, click "Place Order" to simulate)</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || cartItems.length === 0} className="w-full bg-primary hover:bg-primary/90 text-lg py-6">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Placing Order...
                  </>
                ) : (
                  <>
                    <PackageCheck className="mr-2 h-5 w-5" /> Place Order (${grandTotal.toFixed(2)})
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Order Summary</CardTitle>
            <CardDescription>You have {getCartItemCount()} item(s) in your cart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.length > 0 ? (
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                {cartItems.map(item => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Your cart is empty.</p>
            )}
            <Separator />
            <div className="space-y-2 text-lg">
              <div className="flex justify-between font-medium">
                <span>Subtotal:</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Delivery Fee:</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Taxes (Estimated):</span>
                <span>${estimatedTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-primary text-xl">
                <span>Total:</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              <Home className="mr-2 h-4 w-4" /> Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
      <CartSheet />
    </div>
  );
}
