
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
import CartItemCard from '@/components/CartItemCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, CheckCircle, ShieldCheck, QrCode, ArrowLeft, Loader2, Home, PackageCheck, User as UserIcon, Building, Briefcase, MapPin } from 'lucide-react';
import type { Order, Address as AddressType, PaymentSettings } from '@/lib/types';
import { placeOrder, getAddresses, getPaymentSettings, addAddress, updateAddress, setDefaultAddress } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import LocationPicker from '@/components/LocationPicker';

declare global { interface Window { Razorpay: any; } }

const ADD_NEW_ADDRESS_VALUE = "---add-new-address---";

const AddressIcon = ({ type }: { type: AddressType['type'] }) => {
    switch (type) {
        case 'Home': return <Home className="mr-2 h-4 w-4" />;
        case 'Work': return <Briefcase className="mr-2 h-4 w-4" />;
        default: return <Building className="mr-2 h-4 w-4" />;
    }
};

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart, getCartItemCount, isOrderingAllowed, setIsTimeGateDialogOpen, setIsFreeDeliveryDialogOpen, setProceedAction } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'summary' | 'execute_payment' | 'success'>('address');
  
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [pendingOrderData, setPendingOrderData] = useState<Omit<Order, 'id'> | null>(null);
  
  const [formData, setFormData] = useState({ fullName: '', address: '', village: '', city: '', pinCode: '', phone: '', type: 'Home' as AddressType['type'] });
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay'>('Razorpay');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
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
        const addresses = await getAddresses(user.uid);
        setSavedAddresses(addresses);

        const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setFormData({ fullName: defaultAddress.fullName || user.displayName || '', address: defaultAddress.street, village: defaultAddress.village || '', city: defaultAddress.city, pinCode: defaultAddress.pinCode, phone: defaultAddress.phone || '', type: defaultAddress.type });
        } else {
          setSelectedAddressId(ADD_NEW_ADDRESS_VALUE);
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
    const delay = 0;
    setTimeout(async () => {
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
    }, delay);
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


  const handlePlaceOrder = () => {
    if (!user) return;

    const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const villagePart = formData.village ? `${formData.village}, ` : '';
    const newOrderData: Omit<Order, 'id'> = {
        userId: user.uid,
        userEmail: user.email || 'N/A',
        customerName: formData.fullName,
        date: new Date().toISOString(),
        status: 'Order Placed',
        total: grandTotal,
        items: cartItems.map(item => ({ ...item })),
        shippingAddress: `${formData.address}, ${villagePart}${formData.city}, ${formData.pinCode}`,
        paymentMethod: paymentMethod,
        customerPhone: formData.phone,
        deliveryConfirmationCode: confirmationCode,
        deliveryFee: deliveryFee,
        totalTax: totalTax
    };
    
    const completeOrder = () => {
      setPendingOrderData(newOrderData); // Set pending data before payment attempt
      if (paymentMethod === 'Razorpay') {
          handleRazorpayPayment(newOrderData);
      }
    }
    
    if (subTotal > 0 && subTotal < 300) {
        setProceedAction(() => completeOrder);
        setIsFreeDeliveryDialogOpen(true);
    } else {
        completeOrder();
    }
  };

  const handleAddressSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedAddressId === ADD_NEW_ADDRESS_VALUE && saveAddress) {
        setIsSavingAddress(true);
        try {
            const newAddressData: Omit<AddressType, 'id'> = {
                fullName: formData.fullName,
                type: formData.type,
                street: formData.address,
                village: formData.village,
                city: formData.city,
                pinCode: formData.pinCode,
                phone: formData.phone,
                isDefault: savedAddresses.length === 0
            };
            await addAddress(user.uid, newAddressData);
            await loadPageData(); // reload addresses
            toast({ title: "Address Saved!" });
        } catch (error) {
            toast({ title: "Error", description: "Could not save new address.", variant: "destructive" });
        } finally {
            setIsSavingAddress(false);
        }
    }
    setCurrentStep('payment');
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressSelectChange = (value: string) => {
    setSelectedAddressId(value);
    if (value && value !== ADD_NEW_ADDRESS_VALUE) {
      const selectedAddr = savedAddresses.find(addr => addr.id === value);
      if (selectedAddr) {
        setFormData({ fullName: selectedAddr.fullName || '', address: selectedAddr.street, village: selectedAddr.village || '', city: selectedAddr.city, pinCode: selectedAddr.pinCode, phone: selectedAddr.phone || '', type: selectedAddr.type });
      }
    } else {
      setFormData(prev => ({ ...prev, fullName: user?.displayName || '', address: '', village: '', city: '', pinCode: '', phone: '' }));
    }
  };

  const handleLocationSelect = useCallback((address: { street: string; village: string; city: string; pinCode: string; }) => {
    setFormData(prev => ({
        ...prev,
        address: address.street,
        village: address.village,
        city: address.city,
        pinCode: address.pinCode,
    }));
  }, []);


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

  return (
    <>
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold text-center">Checkout</h1>

      {currentStep === 'address' && (
        <Card><form onSubmit={handleAddressSubmit}>
            <CardHeader><CardTitle>Step 1: Shipping Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                {savedAddresses.length > 0 && <div className="space-y-2"><Label>Select Address</Label><Select value={selectedAddressId} onValueChange={handleAddressSelectChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value={ADD_NEW_ADDRESS_VALUE}>+ Add a new address</SelectItem>{savedAddresses.map(addr=><SelectItem key={addr.id} value={addr.id}><AddressIcon type={addr.type}/>{`${addr.street}, ${addr.city}`}</SelectItem>)}</SelectContent></Select></div>}
                
                <div className="space-y-4 border-t pt-6" style={{ display: selectedAddressId === ADD_NEW_ADDRESS_VALUE ? 'block' : 'none' }}>
                    <div className="space-y-2"><Label>Full Name</Label><Input name="fullName" value={formData.fullName} onChange={handleInputChange} required /></div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <Label>Street</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsMapOpen(true)}><MapPin className="mr-2 h-4 w-4" /> Pick on Map</Button>
                        </div>
                        <Input name="address" value={formData.address} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2"><Label>Village/Area (Optional)</Label><Input name="village" value={formData.village} onChange={handleInputChange} /></div>
                    <div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>City</Label><Input name="city" value={formData.city} onChange={handleInputChange} required /></div><div className="space-y-2"><Label>Pin Code</Label><Input name="pinCode" value={formData.pinCode} onChange={handleInputChange} required /></div></div>
                    <div className="space-y-2"><Label>Phone</Label><Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required /></div>
                    <div className="flex items-center space-x-2"><input type="checkbox" id="saveAddress" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="h-4 w-4" /><label htmlFor="saveAddress" className="text-sm">Save this address for future use</label></div>
                </div>
            </CardContent>
            <CardFooter><Button type="submit" disabled={isSavingAddress} className="w-full">{isSavingAddress ? <Loader2 className="animate-spin" /> : 'Continue'}</Button></CardFooter>
        </form></Card>
      )}

      {currentStep === 'payment' && (
        <Card>
            <CardHeader><CardTitle>Step 2: Payment Method</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <div className="flex items-center space-x-3 p-4 border rounded-md border-primary">
                            <CreditCard className="h-6 w-6 text-primary mx-2" />
                            <span className="font-medium">Card, UPI, & More (Razorpay)</span>
                        </div>
                        <div className="px-4 pt-2 text-xs text-muted-foreground">
                            By proceeding, you agree to our{' '}
                            <Link href="/terms-and-conditions" className="underline hover:text-primary">Terms & Conditions</Link>,{' '}
                            <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>,{' '}
                            <Link href="/refund-and-cancellation" className="underline hover:text-primary">Refund & Cancellation Policy</Link>, the{' '}
                            <Link href="/razorpay-terms" className="underline hover:text-primary">Razorpay Terms of Service</Link>, and the{' '}
                            <Link href="/razorpay-privacy" className="underline hover:text-primary">Razorpay Privacy Policy</Link>.
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('address')}>Back</Button>
                <Button onClick={() => setCurrentStep('summary')}>Continue</Button>
            </CardFooter>
        </Card>
      )}

      {currentStep === 'summary' && (
        <Card>
            <CardHeader><CardTitle>Step 3: Confirm Order</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div><h3 className="font-semibold text-lg mb-2">Order Summary</h3>
                <div className="space-y-2 text-lg">
                    <div className="flex justify-between"><span>Subtotal:</span><span>Rs.{subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Delivery:</span><span>{deliveryFee > 0 ? `Rs.${deliveryFee.toFixed(2)}` : <span className="font-semibold text-green-600">FREE</span>}</span></div>
                    <div className="flex justify-between text-sm"><span>Taxes:</span><span>Rs.{totalTax.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-bold text-primary text-xl"><span>Total:</span><span>Rs.{grandTotal.toFixed(2)}</span></div>
                </div></div>
                <Separator />
                <div><h3 className="font-semibold text-lg mb-2">Shipping To</h3>
                    <p className="text-muted-foreground">{formData.fullName}</p>
                    <p className="text-muted-foreground">{formData.address}, {formData.village && `${formData.village}, `}{formData.city}, {formData.pinCode}</p>
                    <p className="text-muted-foreground">{formData.phone}</p>
                </div>
                <Separator />
                <div><h3 className="font-semibold text-lg mb-2">Payment Method</h3>
                    <p className="text-muted-foreground flex items-center">{paymentMethod === 'Razorpay' ? <CreditCard className="mr-2 h-5 w-5" /> : null} {paymentMethod}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('payment')} disabled={isProcessingPayment}>Back</Button>
                <Button onClick={handlePlaceOrder} disabled={isLoading || isProcessingPayment}>
                    {(isLoading || isProcessingPayment) && <Loader2 className="animate-spin mr-2" />} 
                    {(isLoading || isProcessingPayment) ? 'Processing...' : <><PackageCheck className="mr-2" /> Place Order</>}
                </Button>
            </CardFooter>
        </Card>
      )}

    </div>
    <LocationPicker isOpen={isMapOpen} onOpenChange={setIsMapOpen} onLocationSelect={handleLocationSelect} />
    </>
  );
}
