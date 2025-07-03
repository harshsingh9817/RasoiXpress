
"use client";

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle, ShieldCheck, QrCode, ArrowLeft, Loader2, Home, PackageCheck, User as UserIcon, Building, Briefcase, MapPin } from 'lucide-react';
import type { Order, Address as AddressType, PaymentSettings } from '@/lib/types';
import { placeOrder, getAddresses, getPaymentSettings, addAddress, updateAddress, setDefaultAddress } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { Badge } from '@/components/ui/badge';
import LocationPicker from '@/components/LocationPicker';

declare global { interface Window { Razorpay: any; } }

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart, getCartItemCount, isOrderingAllowed, setIsTimeGateDialogOpen, setIsFreeDeliveryDialogOpen, setProceedAction } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'address' | 'summary' | 'success'>('address');
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  
  const [formData, setFormData] = useState({ fullName: '', street: '', village: '', city: '', pinCode: '', phone: '', alternatePhone: '' });
  const [mapSelectedAddress, setMapSelectedAddress] = useState<Partial<AddressType> | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);


  const subTotal = getCartTotal();
  const deliveryFee = subTotal > 0 && subTotal < 300 ? 30 : 0;
  const totalTax = cartItems.reduce((acc, item) => {
    const itemTax = item.price * (item.taxRate || 0);
    return acc + (itemTax * item.quantity);
  }, 0);
  const grandTotal = subTotal + deliveryFee + totalTax;

  const loadPageData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
        const addresses = await getAddresses(user.uid);
        if (addresses.length > 0) {
            const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
            setMapSelectedAddress(defaultAddress);
            setFormData({ fullName: defaultAddress.fullName, street: defaultAddress.street, village: defaultAddress.village || '', city: defaultAddress.city, pinCode: defaultAddress.pinCode, phone: defaultAddress.phone, alternatePhone: defaultAddress.alternatePhone || '' });
        } else {
            setFormData(prev => ({...prev, fullName: user.displayName || ''}));
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
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (getCartItemCount() === 0 && currentStep !== 'success') { router.replace('/'); return; }
    if (!isOrderingAllowed) { setIsTimeGateDialogOpen(true); router.replace('/'); return; }
    loadPageData();
  }, [isAuthenticated, isAuthLoading, user, getCartItemCount, router, currentStep, loadPageData, isOrderingAllowed, setIsTimeGateDialogOpen]);

  const finalizeOrder = async (orderData: Omit<Order, 'id'>) => {
    setIsLoading(true);
    try {
        const placedOrder = await placeOrder(orderData);
        setOrderDetails(placedOrder);
        clearCart();
        setCurrentStep('success');
        setTimeout(() => { router.push('/my-orders'); }, 8000);
    } catch (error) {
        console.error("Failed to place order:", error);
        toast({ title: "Order Failed", description: "Could not place your order. Please try again.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-checkout-js')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (orderData: Omit<Order, 'id'>) => {
    setIsProcessingPayment(true);
    
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId) {
      toast({
        title: "Configuration Error",
        description: "Payment gateway is not configured. Please contact support.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({ title: "Payment Error", description: "Could not load payment gateway. Please try again.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    try {
      const orderResponse = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }
      const razorpayOrder = await orderResponse.json();

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Rasoi Xpress",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          const verificationResponse = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verificationResult = await verificationResponse.json();

          if (verificationResult.success) {
            const finalOrderData = {
              ...orderData,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            };
            await finalizeOrder(finalOrderData);
          } else {
            toast({ title: "Payment Failed", description: "Payment verification failed. Please contact support.", variant: "destructive" });
          }
        },
        prefill: { name: formData.fullName, email: user?.email, contact: formData.phone },
        theme: { color: "#E64A19" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        toast({ title: "Payment Failed", description: response.error.description || 'An unknown error occurred.', variant: "destructive" });
      });
      paymentObject.open();

    } catch (error: any) {
      console.error("Error during Razorpay process:", error);
      toast({ title: "Error", description: error.message || "Could not initiate payment. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };


  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !mapSelectedAddress) {
        toast({ title: "Address Required", description: "Please select an address from the map first.", variant: "destructive" });
        return;
    }
    
    // Save the address automatically
    const fullAddress: Omit<AddressType, 'id'> = {
        fullName: formData.fullName,
        type: 'Home', // Simplified
        street: formData.street, // House No.
        village: mapSelectedAddress.village || '',
        city: mapSelectedAddress.city || '',
        pinCode: mapSelectedAddress.pinCode || '',
        phone: formData.phone,
        alternatePhone: formData.alternatePhone || '',
        isDefault: true, // For simplicity, new address is always default
    };
    
    try {
        await setDefaultAddress(user.uid, (await addAddress(user.uid, fullAddress)).id);
    } catch (error) {
        console.error("Failed to auto-save address:", error);
        toast({ title: "Could not save address", variant: "destructive" });
        return; // Stop if address can't be saved
    }

    const villagePart = fullAddress.village ? `${fullAddress.village}, ` : '';
    const newOrderData: Omit<Order, 'id'> = {
        userId: user.uid,
        userEmail: user.email || 'N/A',
        customerName: fullAddress.fullName,
        date: new Date().toISOString(),
        status: 'Order Placed',
        total: grandTotal,
        items: cartItems.map(item => ({ ...item })),
        shippingAddress: `${fullAddress.street}, ${villagePart}${fullAddress.city}, ${fullAddress.pinCode}`,
        paymentMethod: paymentSettings?.isRazorpayEnabled ? 'Razorpay' : 'Cash on Delivery',
        customerPhone: fullAddress.phone,
        deliveryConfirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        deliveryFee: deliveryFee,
        totalTax: totalTax
    };
    
    const completeOrder = () => {
      if (paymentSettings?.isRazorpayEnabled) {
          handleRazorpayPayment(newOrderData);
      } else {
          finalizeOrder(newOrderData);
      }
    }
    
    if (subTotal > 0 && subTotal < 300) {
        setProceedAction(() => completeOrder);
        setIsFreeDeliveryDialogOpen(true);
    } else {
        completeOrder();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLocationSelect = (address: { street: string; village: string; city: string; pinCode: string; }) => {
    setMapSelectedAddress({
        street: address.street,
        village: address.village,
        city: address.city,
        pinCode: address.pinCode,
    });
    setFormData(prev => ({
        ...prev,
        // Don't auto-fill house number, let the user enter it
        village: address.village,
        city: address.city,
        pinCode: address.pinCode,
    }));
  };

  const displayAddressParts = mapSelectedAddress ? [
    mapSelectedAddress.street,
    // Only add village if it's different and not empty
    mapSelectedAddress.village && mapSelectedAddress.village.toLowerCase() !== mapSelectedAddress.street?.toLowerCase() ? mapSelectedAddress.village : null,
    mapSelectedAddress.city,
    mapSelectedAddress.pinCode
  ].filter(Boolean).join(', ') : '';


  if (isAuthLoading || !isAuthenticated || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Loading..." : "Getting ready..."}</p>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4">
        <CheckCircle className="h-24 w-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Order Placed!</h1>
        <p className="text-lg text-muted-foreground max-w-md">You can track your order on the "My Orders" page.</p>
        {orderDetails?.deliveryConfirmationCode && (
           <Card className="mt-6 text-center p-4 border-dashed"><CardHeader className="p-2"><CardTitle className="text-lg text-primary"><ShieldCheck className="mr-2 h-5 w-5 inline"/>Delivery Code</CardTitle></CardHeader><CardContent className="p-2"><p className="text-4xl font-bold tracking-widest">{orderDetails.deliveryConfirmationCode}</p><p className="text-xs text-muted-foreground mt-2">Share this with the delivery partner.</p></CardContent></Card>
        )}
        <div className="mt-8 flex gap-4">
            <Button onClick={() => router.push('/my-orders')} size="lg">Go to My Orders</Button>
            <Button onClick={() => router.push('/')} variant="outline" size="lg">Continue Shopping</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-6">Redirecting automatically...</p>
      </div>
    );
  }

  const isProcessing = isLoading || isProcessingPayment;

  return (
    <>
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="space-y-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-left">Checkout</h1>
        
        <Card><form onSubmit={handlePlaceOrder}>
            <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
                <CardDescription>Select a location, then provide your details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Button type="button" variant="outline" className="w-full h-12 text-base" onClick={() => setIsMapOpen(true)}>
                    <MapPin className="mr-2 h-5 w-5" /> 
                    {mapSelectedAddress ? 'Change Delivery Location' : 'Select Delivery Location on Map'}
                </Button>
                
                {mapSelectedAddress && (
                    <div className="p-3 border rounded-md bg-muted/50">
                        <p className="font-semibold text-sm">Selected Location:</p>
                        <p className="text-sm text-muted-foreground">
                            {displayAddressParts}
                        </p>
                    </div>
                )}
                
                <Separator />

                <div className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="e.g. Sunil Kumar"/></div>
                    <div className="space-y-2"><Label htmlFor="street">House No. / Street / Building</Label><Input id="street" name="street" placeholder="e.g. House No. 123, ABC Lane" value={formData.street} onChange={handleInputChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="10-digit mobile number"/></div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isProcessing || !mapSelectedAddress || !formData.street} className="w-full">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <PackageCheck className="mr-2" />} 
                    {isProcessing ? 'Processing...' : `Place Order (${paymentSettings?.isRazorpayEnabled ? "Pay Online" : "COD"})`}
                </Button>
            </CardFooter>
        </form></Card>
      </div>
      
      <div className="space-y-6 sticky top-24">
         <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2 text-lg">
                    <div className="flex justify-between"><span>Subtotal:</span><span>Rs.{subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Delivery:</span><span>{deliveryFee > 0 ? `Rs.${deliveryFee.toFixed(2)}` : <span className="font-semibold text-green-600">FREE</span>}</span></div>
                    <div className="flex justify-between text-sm"><span>Taxes:</span><span>Rs.{totalTax.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-primary text-xl"><span>Total:</span><span>Rs.{grandTotal.toFixed(2)}</span></div>
                </div>
            </CardContent>
         </Card>
      </div>

    </div>
    <LocationPicker 
        isOpen={isMapOpen} 
        onOpenChange={setIsMapOpen} 
        onLocationSelect={handleLocationSelect}
        apiUrl={paymentSettings?.mapApiUrl}
     />
    </>
  );
}
