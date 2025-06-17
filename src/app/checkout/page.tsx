
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Home, Loader2, PackageCheck } from 'lucide-react';
import type { Order, Address as AddressType } from '@/lib/types';

const ADD_NEW_ADDRESS_VALUE = "---add-new-address---";

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
    pinCode: '', // Changed from postalCode
    phone: '', // This is the order contact phone, distinct from address phone
  });
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(ADD_NEW_ADDRESS_VALUE);

  useEffect(() => {
    setIsClient(true);
    if (getCartItemCount() === 0) {
      router.replace('/');
    }

    if (typeof window !== 'undefined') {
      const storedAddressesString = localStorage.getItem('nibbleNowUserAddresses');
      if (storedAddressesString) {
        try {
          const addresses = JSON.parse(storedAddressesString) as AddressType[];
          setSavedAddresses(addresses);

          const defaultAddress = addresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setFormData(prev => ({
              ...prev,
              address: defaultAddress.street,
              city: defaultAddress.city,
              pinCode: defaultAddress.pinCode,
              // formData.phone is for the order, not necessarily from the saved address's phone
            }));
          } else {
             setSelectedAddressId(ADD_NEW_ADDRESS_VALUE);
          }
        } catch (e) {
          console.error("Failed to parse addresses from localStorage for checkout", e);
          setSavedAddresses([]);
          setSelectedAddressId(ADD_NEW_ADDRESS_VALUE);
        }
      } else {
        setSavedAddresses([]);
        setSelectedAddressId(ADD_NEW_ADDRESS_VALUE);
      }
    }
  }, [getCartItemCount, router]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelectChange = (value: string) => {
    setSelectedAddressId(value);
    if (value && value !== ADD_NEW_ADDRESS_VALUE) {
      const selectedAddr = savedAddresses.find(addr => addr.id === value);
      if (selectedAddr) {
        setFormData(prev => ({
          ...prev,
          address: selectedAddr.street,
          city: selectedAddr.city,
          pinCode: selectedAddr.pinCode,
           // formData.phone is for the order, not necessarily from the saved address's phone
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        address: '',
        city: '',
        pinCode: '',
      }));
    }
  };

  const handleSubmitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const newOrder: Order = {
      id: `ORD${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Order Placed',
      total: getCartTotal() + 2.99 + (getCartTotal() * 0.08),
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category,
        description: item.description,
      })),
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.pinCode}`, // Use pinCode
    };

    if (typeof window !== 'undefined') {
      const existingOrdersString = localStorage.getItem('nibbleNowUserOrders');
      let orders: Order[] = [];
      if (existingOrdersString) {
        try {
          orders = JSON.parse(existingOrdersString);
        } catch (e) {
          console.error("Failed to parse orders from localStorage", e);
          orders = [];
        }
      }
      orders.unshift(newOrder);
      localStorage.setItem('nibbleNowUserOrders', JSON.stringify(orders));
    }

    toast({
      title: 'Order Placed Successfully!',
      description: 'Thank you for your order. We will process it shortly.',
      variant: 'default',
      duration: 5000,
    });
    clearCart();
    router.push('/profile');
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

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="savedAddressSelect">Saved Addresses</Label>
                  <Select
                    value={selectedAddressId}
                    onValueChange={handleAddressSelectChange}
                  >
                    <SelectTrigger id="savedAddressSelect" className="w-full">
                      <SelectValue placeholder="Select a saved address or enter manually" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ADD_NEW_ADDRESS_VALUE}>Enter new address manually</SelectItem>
                      {savedAddresses.map(addr => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {`${addr.type}: ${addr.street}, ${addr.city}, ${addr.pinCode}${addr.isDefault ? " (Default)" : ""}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                  <Label htmlFor="pinCode">Pin Code</Label>
                  <Input id="pinCode" name="pinCode" value={formData.pinCode} onChange={handleInputChange} placeholder="12345" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone Number (for this order)</Label>
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
