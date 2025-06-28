
"use client";

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CartItemCard from '@/components/CartItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Home, Loader2, PackageCheck, Wallet, CheckCircle, Shield, QrCode, ArrowLeft } from 'lucide-react';
import type { Order, Address as AddressType, PaymentSettings } from '@/lib/types';
import { placeOrder, getAddresses, getPaymentSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const ADD_NEW_ADDRESS_VALUE = "---add-new-address---";

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart, getCartItemCount } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'success'>('details');
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [pendingOrderData, setPendingOrderData] = useState<Omit<Order, 'id'> | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    village: '',
    city: '',
    pinCode: '',
    phone: '',
  });
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(ADD_NEW_ADDRESS_VALUE);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash on Delivery'>('UPI');

  const loadPageData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
        const [addresses, settings] = await Promise.all([
            getAddresses(user.uid),
            getPaymentSettings()
        ]);
        
        setSavedAddresses(addresses);
        setPaymentSettings(settings);
        setFormData(prev => ({...prev, fullName: user.displayName || ''}));
        
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setFormData(prev => ({
            ...prev,
            fullName: defaultAddress.fullName || user.displayName || '',
            address: defaultAddress.street,
            village: defaultAddress.village || '',
            city: defaultAddress.city,
            pinCode: defaultAddress.pinCode,
            phone: defaultAddress.phone || '',
          }));
        }
    } catch (error) {
        console.error("Failed to load checkout data", error);
        toast({ title: "Error", description: "Could not load checkout data.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    if (getCartItemCount() === 0 && checkoutStep !== 'success') {
      router.replace('/');
      return;
    }
    loadPageData();
  }, [isAuthenticated, isAuthLoading, user, getCartItemCount, router, checkoutStep, loadPageData]);

  const subTotal = getCartTotal();
  const deliveryFee = paymentSettings?.deliveryFee ?? 49;
  const taxRate = paymentSettings?.taxRate ?? 0.05;
  const estimatedTax = subTotal * taxRate;
  const grandTotal = subTotal + deliveryFee + estimatedTax;

  const finalizeOrder = async (orderData: Omit<Order, 'id'>) => {
    setIsLoading(true);

    const isUpi = orderData.paymentMethod === 'UPI';
    const delay = isUpi ? 2500 : 0;

    setTimeout(async () => {
        try {
            const placedOrder = await placeOrder(orderData);
            setOrderDetails(placedOrder);
            
            clearCart();
            setCheckoutStep('success');
        
            setTimeout(() => {
                router.push('/profile');
            }, 8000);

        } catch (error) {
            console.error("Failed to place order:", error);
            toast({ title: "Order Failed", description: "Could not place your order. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, delay);
  };

  const handleProceedToPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to place an order.", variant: "destructive"});
        return;
    }

    const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const villagePart = formData.village ? `${formData.village}, ` : '';

    const newOrderData: Omit<Order, 'id'> = {
      userId: user.uid,
      userEmail: user.email || 'N/A',
      customerName: formData.fullName,
      date: new Date().toISOString(),
      status: 'Order Placed',
      total: grandTotal,
      items: cartItems.map(item => ({ ...item })), // Pass all item properties
      shippingAddress: `${formData.address}, ${villagePart}${formData.city}, ${formData.pinCode}`,
      paymentMethod: paymentMethod,
      customerPhone: formData.phone,
      deliveryConfirmationCode: confirmationCode,
      deliveryFee: deliveryFee,
      taxRate: taxRate,
    };
    
    setPendingOrderData(newOrderData);

    if (paymentMethod === 'UPI') {
        setCheckoutStep('payment');
    } else {
        finalizeOrder(newOrderData);
    }
  };

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
          fullName: selectedAddr.fullName || '',
          address: selectedAddr.street,
          village: selectedAddr.village || '',
          city: selectedAddr.city,
          pinCode: selectedAddr.pinCode,
          phone: selectedAddr.phone || '',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        fullName: user?.displayName || '',
        address: '',
        village: '',
        city: '',
        pinCode: '',
        phone: '',
      }));
    }
  };

  if (isAuthLoading || !isAuthenticated || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">
          {isAuthLoading ? "Loading..." : isDataLoading ? "Getting everything ready..." : "Redirecting to login..."}
        </p>
      </div>
    );
  }

  if (checkoutStep === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
          <CheckCircle className="relative h-24 w-24 text-green-500" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-primary mb-2 animate-fade-in-up">Order Placed!</h1>
        <p className="text-lg text-muted-foreground max-w-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Thank you for your purchase. You can track the status of your order on your profile page.
        </p>
        
        {orderDetails?.deliveryConfirmationCode && (
           <Card className="mt-6 text-center animate-fade-in-up p-4 border-dashed border-primary" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="p-2">
                <CardTitle className="flex items-center justify-center text-lg text-primary">
                    <Shield className="mr-2 h-5 w-5"/> Your Delivery Code
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <p className="text-4xl font-bold tracking-widest text-primary">{orderDetails.deliveryConfirmationCode}</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                    Please share this code with the delivery partner to confirm you have received your order.
                </p>
              </CardContent>
           </Card>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button onClick={() => router.push('/profile')} size="lg">
                Go to My Orders
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" size="lg">
                Continue Shopping
            </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          You will be redirected to your profile automatically in a few seconds...
        </p>
      </div>
    );
  }

  if (checkoutStep === 'payment') {
      return (
          <div className="max-w-md mx-auto">
              <Card className="shadow-xl">
                  <CardHeader>
                      <CardTitle className="text-2xl font-headline flex items-center gap-2">
                          <QrCode className="h-6 w-6 text-primary" />
                          Complete Your Payment
                      </CardTitle>
                      <CardDescription>Scan the QR code with any UPI app to pay.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-white rounded-lg border">
                          {paymentSettings ? (
                            <Image 
                              src={paymentSettings.qrCodeImageUrl}
                              alt="UPI QR Code" 
                              width={250} 
                              height={250}
                              data-ai-hint="qr code"
                            />
                          ) : <Skeleton className="h-[250px] w-[250px]" />}
                      </div>
                      <div className="text-center">
                          <p className="text-sm text-muted-foreground">Or pay to UPI ID:</p>
                          {paymentSettings ? (
                            <p className="font-semibold text-lg tracking-wider">{paymentSettings.upiId}</p>
                          ) : <Skeleton className="h-6 w-48 mt-1" />}
                      </div>
                      <Separator />
                      <div className="w-full text-center">
                          <p className="text-muted-foreground">Amount to Pay</p>
                          <p className="text-4xl font-bold text-primary">Rs.{grandTotal.toFixed(2)}</p>
                      </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-4">
                      <Button 
                        onClick={() => finalizeOrder(pendingOrderData!)} 
                        disabled={isLoading} 
                        className="w-full text-lg py-6"
                      >
                          {isLoading ? (
                              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying Payment...</>
                          ) : (
                              <><CheckCircle className="mr-2 h-5 w-5"/> I Have Paid</>
                          )}
                      </Button>
                       <Button 
                        variant="outline" 
                        onClick={() => setCheckoutStep('details')}
                        disabled={isLoading}
                        className="w-full"
                       >
                         <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                       </Button>
                  </CardFooter>
              </Card>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="text-center">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2 animate-fade-in-up">Checkout</h1>
        <p className="text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Almost there! Please review your order and provide your details.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-headline">Shipping & Payment</CardTitle>
            <CardDescription>Enter your shipping address and payment details.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProceedToPayment}>
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
                          {`${addr.fullName}: ${addr.street}, ${addr.city}${addr.isDefault ? " (Default)" : ""}`}
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
              <div className="space-y-2">
                <Label htmlFor="village">Village (Optional)</Label>
                <Input id="village" name="village" value={formData.village} onChange={handleInputChange} placeholder="Kothrud" />
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
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="(+91) 98765-43210" required />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-lg font-medium">Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: string) => setPaymentMethod(value as 'UPI' | 'Cash on Delivery')}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="payment-upi"
                    className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary"
                  >
                    <RadioGroupItem value="UPI" id="payment-upi" />
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span>UPI / QR Code</span>
                  </Label>
                  <Label
                    htmlFor="payment-cod"
                    className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary"
                  >
                    <RadioGroupItem value="Cash on Delivery" id="payment-cod" /> 
                    <Wallet className="h-5 w-5 text-primary" />
                    <span>Cash on Delivery</span>
                  </Label>
                </RadioGroup>
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
                    <PackageCheck className="mr-2 h-5 w-5" /> Place Order (Rs.{grandTotal.toFixed(2)})
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-headline">Order Summary</CardTitle>
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
                <span>Rs.{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Delivery Fee:</span>
                <span>Rs.{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Taxes (Estimated):</span>
                <span>Rs.{estimatedTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-primary text-xl">
                <span>Total:</span>
                <span>Rs.{grandTotal.toFixed(2)}</span>
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
    </div>
  );
}
