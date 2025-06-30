
"use client";

import { useState, type FormEvent, useEffect, useCallback, useMemo } from 'react';
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
import { CreditCard, Home, PackageCheck, Wallet, CheckCircle, ShieldCheck, QrCode, ArrowLeft, Loader2, MapPin } from 'lucide-react';
import type { Order, Address as AddressType, PaymentSettings } from '@/lib/types';
import { placeOrder, getAddresses, getPaymentSettings, getUserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { Badge } from '@/components/ui/badge';
import LocationPicker from '@/components/LocationPicker'; // Import the new component

const ADD_NEW_ADDRESS_VALUE = "---add-new-address---";

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart, getCartItemCount, isOrderingAllowed, setIsTimeGateDialogOpen } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'success'>('details');
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [pendingOrderData, setPendingOrderData] = useState<Omit<Order, 'id'> | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  
  const [formData, setFormData] = useState({ fullName: '', address: '', village: '', city: '', pinCode: '', phone: '' });
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(ADD_NEW_ADDRESS_VALUE);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash on Delivery'>('UPI');

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  
  // New state for map dialog
  const [isMapOpen, setIsMapOpen] = useState(false);

  const calculateDeliveryFee = useCallback(async (fullAddress: string) => {
    if (!fullAddress.trim()) {
      setDeliveryFee(0);
      setCalculationError(null);
      return;
    }

    setIsCalculatingFee(true);
    setCalculationError(null);

    try {
      const response = await fetch('/api/calculate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: fullAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate delivery fee.');
      }
      setDeliveryFee(data.fee);
    } catch (error: any) {
      console.error("Delivery fee calculation error:", error);
      setCalculationError(error.message);
      setDeliveryFee(0);
    } finally {
      setIsCalculatingFee(false);
    }
  }, []);
  
  const debouncedCalculateFee = useCallback((address: string) => {
    const handler = setTimeout(() => {
        calculateDeliveryFee(address);
    }, 1000); // 1-second debounce
    return () => clearTimeout(handler);
  }, [calculateDeliveryFee]);

  useEffect(() => {
    if (selectedAddressId === ADD_NEW_ADDRESS_VALUE) {
        const { address, village, city, pinCode } = formData;
        if (address && city && pinCode) {
            const fullAddress = `${address}, ${village ? village + ', ' : ''}${city}, ${pinCode}, India`;
            debouncedCalculateFee(fullAddress);
        } else {
            setDeliveryFee(0);
            setCalculationError(null);
        }
    }
  }, [formData, selectedAddressId, debouncedCalculateFee]);

  const loadPageData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
        const [addresses, settings, userProfile] = await Promise.all([
             getAddresses(user.uid), 
             getPaymentSettings(),
             getUserProfile(user.uid)
        ]);
        setSavedAddresses(addresses);
        setPaymentSettings(settings);

        if (userProfile && userProfile.hasCompletedFirstOrder === false) {
            setIsFirstOrder(true);
        } else {
            setIsFirstOrder(false);
        }

        setFormData(prev => ({...prev, fullName: user.displayName || ''}));
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setFormData(prev => ({ ...prev, fullName: defaultAddress.fullName || user.displayName || '', address: defaultAddress.street, village: defaultAddress.village || '', city: defaultAddress.city, pinCode: defaultAddress.pinCode, phone: defaultAddress.phone || '' }));
          const fullAddress = `${defaultAddress.street}, ${defaultAddress.village ? defaultAddress.village + ', ' : ''}${defaultAddress.city}, ${defaultAddress.pinCode}, India`;
          calculateDeliveryFee(fullAddress);
        }
    } catch (error) {
        console.error("Failed to load checkout data", error);
        toast({ title: "Error", description: "Could not load checkout data.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [user, toast, calculateDeliveryFee]);
  
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
    if (!isOrderingAllowed) {
        setIsTimeGateDialogOpen(true);
        router.replace('/'); // Go back home if restaurant is closed
        return;
    }
    loadPageData();
  }, [isAuthenticated, isAuthLoading, user, getCartItemCount, router, checkoutStep, loadPageData, isOrderingAllowed, setIsTimeGateDialogOpen]);

  const subTotal = getCartTotal();
  const cartQuantity = getCartItemCount();
  const surcharge = !isFirstOrder && cartQuantity > 3 ? 15 : 0;
  const finalDeliveryFee = (isFirstOrder || subTotal > 500) ? 0 : deliveryFee + surcharge;
  const totalTax = cartItems.reduce((acc, item) => {
    const itemTax = item.price * (item.taxRate || 0);
    return acc + (itemTax * item.quantity);
  }, 0);
  const grandTotal = subTotal + finalDeliveryFee + totalTax;

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
            setTimeout(() => { router.push('/my-orders'); }, 8000);
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
    if (!isOrderingAllowed) {
        setIsTimeGateDialogOpen(true);
        return;
    }
    if (calculationError) {
        toast({ title: "Address Error", description: calculationError, variant: "destructive" });
        return;
    }
    if (!user) return;
    const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const villagePart = formData.village ? `${formData.village}, ` : '';
    const newOrderData: Omit<Order, 'id'> = { userId: user.uid, userEmail: user.email || 'N/A', customerName: formData.fullName, date: new Date().toISOString(), status: 'Order Placed', total: grandTotal, items: cartItems.map(item => ({ ...item })), shippingAddress: `${formData.address}, ${villagePart}${formData.city}, ${formData.pinCode}`, paymentMethod: paymentMethod, customerPhone: formData.phone, deliveryConfirmationCode: confirmationCode, deliveryFee: finalDeliveryFee, totalTax: totalTax };
    setPendingOrderData(newOrderData);
    if (paymentMethod === 'UPI') {
        setCheckoutStep('payment');
    } else {
        finalizeOrder(newOrderData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressSelectChange = (value: string) => {
    setSelectedAddressId(value);
    if (value && value !== ADD_NEW_ADDRESS_VALUE) {
      const selectedAddr = savedAddresses.find(addr => addr.id === value);
      if (selectedAddr) {
        setFormData(prev => ({ ...prev, fullName: selectedAddr.fullName || '', address: selectedAddr.street, village: selectedAddr.village || '', city: selectedAddr.city, pinCode: selectedAddr.pinCode, phone: selectedAddr.phone || '' }));
        const fullAddress = `${selectedAddr.street}, ${selectedAddr.village ? selectedAddr.village + ', ' : ''}${selectedAddr.city}, ${selectedAddr.pinCode}, India`;
        calculateDeliveryFee(fullAddress);
      }
    } else {
      setFormData(prev => ({ ...prev, fullName: user?.displayName || '', address: '', village: '', city: '', pinCode: '', phone: '' }));
      setDeliveryFee(0);
      setCalculationError(null);
    }
  };

  // New handler for location selection from map
  const handleLocationSelect = (address: { street: string; village: string; city: string; pinCode: string; }) => {
    setFormData(prev => ({
        ...prev,
        address: address.street,
        village: address.village,
        city: address.city,
        pinCode: address.pinCode,
    }));
    // Ensure we are in "new address" mode to trigger fee calculation
    setSelectedAddressId(ADD_NEW_ADDRESS_VALUE);
  };

  if (isAuthLoading || !isAuthenticated || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary">
            <AnimatedPlateSpinner />
        </div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Loading..." : "Getting ready..."}</p>
      </div>
    );
  }

  if (checkoutStep === 'success') {
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

  if (checkoutStep === 'payment') {
      return (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
                <CardDescription>Scan the QR to pay.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {paymentSettings ? <Image src={paymentSettings.qrCodeImageUrl} alt="UPI QR Code" width={250} height={250} data-ai-hint="qr code"/> : <Skeleton className="h-[250px] w-[250px]" />}
                <div>
                  <p className="text-sm text-muted-foreground">Or pay to:</p>
                  {paymentSettings ? <p className="font-semibold text-lg">{paymentSettings.upiId}</p> : <Skeleton className="h-6 w-48 mt-1" />}
                </div>
                <Separator />
                <div className="w-full text-center">
                  <p className="text-muted-foreground">Amount</p>
                  <p className="text-4xl font-bold text-primary">Rs.{grandTotal.toFixed(2)}</p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button onClick={() => finalizeOrder(pendingOrderData!)} disabled={isLoading} className="w-full">
                  {isLoading ? <><div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div>Verifying...</> : <><CheckCircle className="mr-2 h-5 w-5"/>I Have Paid</>}
                </Button>
                <Button variant="outline" onClick={() => setCheckoutStep('details')} disabled={isLoading} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
              </CardFooter>
            </Card>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold text-center">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card><CardHeader><CardTitle>Shipping & Payment</CardTitle></CardHeader><form onSubmit={handleProceedToPayment}><CardContent className="space-y-6"><div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required /></div>{savedAddresses.length > 0 && <div className="space-y-2"><Label>Saved Addresses</Label><Select value={selectedAddressId} onValueChange={handleAddressSelectChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value={ADD_NEW_ADDRESS_VALUE}>Enter new address</SelectItem>{savedAddresses.map(addr=><SelectItem key={addr.id} value={addr.id}>{`${addr.fullName}: ${addr.street}${addr.village ? `, ${addr.village}` : ''}, ${addr.city}`}</SelectItem>)}</SelectContent></Select></div>}
        
        <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
                <Label>Street</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsMapOpen(true)}>
                    <MapPin className="mr-2 h-4 w-4"/> Pick on Map
                </Button>
            </div>
            <Input name="address" value={formData.address} onChange={handleInputChange} required />
        </div>
        
        <div className="space-y-2"><Label>Village/Area (Optional)</Label><Input name="village" value={formData.village} onChange={handleInputChange} placeholder="E.g., near the post office" /></div><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>City</Label><Input name="city" value={formData.city} onChange={handleInputChange} required /></div><div className="space-y-2"><Label>Pin Code</Label><Input name="pinCode" value={formData.pinCode} onChange={handleInputChange} required /></div></div><div className="space-y-2"><Label>Phone</Label><Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required /></div><Separator /><div className="space-y-2"><Label>Payment</Label><RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}><Label className="flex items-center space-x-3 p-3 border rounded-md"><RadioGroupItem value="UPI" /><CreditCard className="h-5 w-5 text-primary mx-2" /><span>UPI</span></Label><Label className="flex items-center space-x-3 p-3 border rounded-md"><RadioGroupItem value="Cash on Delivery" /><Wallet className="h-5 w-5 text-primary mx-2" /><span>Cash on Delivery</span></Label></RadioGroup></div></CardContent><CardFooter><Button type="submit" disabled={isLoading || cartItems.length === 0 || !!calculationError} className="w-full">{isLoading ? <div className="w-6 h-6 mr-2"><AnimatedPlateSpinner /></div> : <PackageCheck className="mr-2 h-5 w-5" />} {isLoading ? 'Placing Order...' : `Place Order (Rs.${grandTotal.toFixed(2)})`}</Button></CardFooter></form></Card>
        <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle><CardDescription>{getCartItemCount()} item(s)</CardDescription></CardHeader>
            <CardContent className="space-y-4">
                {cartItems.length > 0 ? <div className="max-h-96 overflow-y-auto pr-2 space-y-3">{cartItems.map(item => <CartItemCard key={item.id} item={item} />)}</div> : <p>Cart is empty.</p>}
                <Separator />
                <div className="space-y-2 text-lg">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>Rs.{subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="flex items-center">Delivery:</span>
                        {isCalculatingFee ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : finalDeliveryFee === 0 ? (
                            <span className="font-semibold text-green-600">FREE</span>
                        ) : (
                            <span>Rs.{finalDeliveryFee.toFixed(2)}</span>
                        )}
                    </div>
                     {calculationError && (
                        <div className="flex justify-end -mt-1">
                            <p className="text-xs text-destructive text-right">{calculationError}</p>
                        </div>
                    )}
                    {surcharge > 0 && !isFirstOrder && (
                        <div className="flex justify-end -mt-1">
                            <p className="text-xs text-muted-foreground">Includes ₹15 heavy order fee</p>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span>Taxes:</span>
                        <span>Rs.{totalTax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    {isFirstOrder ? (
                        <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800 border-green-200 my-2">
                           🎉 First Order Free Delivery Applied! 🎉
                        </Badge>
                    ) : (subTotal > 500 && (
                        <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800 border-green-200 my-2">
                           🎉 Free Delivery on orders over Rs.500! 🎉
                        </Badge>
                    ))}
                    <div className="flex justify-between font-bold text-primary text-xl">
                        <span>Total:</span>
                        <span>Rs.{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter><Button variant="outline" onClick={() => router.push('/')} className="w-full"><Home className="mr-2 h-4 w-4" /> Continue Shopping</Button></CardFooter>
        </Card>
      </div>
      <LocationPicker isOpen={isMapOpen} onOpenChange={setIsMapOpen} onLocationSelect={handleLocationSelect} />
    </div>
  );
}
