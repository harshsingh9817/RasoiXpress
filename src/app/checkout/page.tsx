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
  
  const [formData, setFormData] = useState({ fullName: '', address: '', village: '', city: '', pinCode: '', phone: '' });
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(ADD_NEW_ADDRESS_VALUE);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash on Delivery'>('UPI');

  const loadPageData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
        const [addresses, settings] = await Promise.all([ getAddresses(user.uid), getPaymentSettings() ]);
        setSavedAddresses(addresses);
        setPaymentSettings(settings);
        setFormData(prev => ({...prev, fullName: user.displayName || ''}));
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setFormData(prev => ({ ...prev, fullName: defaultAddress.fullName || user.displayName || '', address: defaultAddress.street, village: defaultAddress.village || '', city: defaultAddress.city, pinCode: defaultAddress.pinCode, phone: defaultAddress.phone || '' }));
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
    if (!user) return;
    const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const villagePart = formData.village ? `${formData.village}, ` : '';
    const newOrderData: Omit<Order, 'id'> = { userId: user.uid, userEmail: user.email || 'N/A', customerName: formData.fullName, date: new Date().toISOString(), status: 'Order Placed', total: grandTotal, items: cartItems.map(item => ({ ...item })), shippingAddress: `${formData.address}, ${villagePart}${formData.city}, ${formData.pinCode}`, paymentMethod: paymentMethod, customerPhone: formData.phone, deliveryConfirmationCode: confirmationCode, deliveryFee: deliveryFee, taxRate: taxRate };
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
      if (selectedAddr) setFormData(prev => ({ ...prev, fullName: selectedAddr.fullName || '', address: selectedAddr.street, village: selectedAddr.village || '', city: selectedAddr.city, pinCode: selectedAddr.pinCode, phone: selectedAddr.phone || '' }));
    } else {
      setFormData(prev => ({ ...prev, fullName: user?.displayName || '', address: '', village: '', city: '', pinCode: '', phone: '' }));
    }
  };

  if (isAuthLoading || !isAuthenticated || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">{isAuthLoading ? "Loading..." : "Getting ready..."}</p>
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
           <Card className="mt-6 text-center p-4 border-dashed"><CardHeader className="p-2"><CardTitle className="text-lg text-primary"><Shield className="mr-2 h-5 w-5 inline"/>Delivery Code</CardTitle></CardHeader><CardContent className="p-2"><p className="text-4xl font-bold tracking-widest">{orderDetails.deliveryConfirmationCode}</p><p className="text-xs text-muted-foreground mt-2">Share this with the delivery partner.</p></CardContent></Card>
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
          <div className="max-w-md mx-auto"><Card><CardHeader><CardTitle>Complete Payment</CardTitle><CardDescription>Scan the QR to pay.</CardDescription></CardHeader><CardContent className="flex flex-col items-center gap-4">{paymentSettings ? <Image src={paymentSettings.qrCodeImageUrl} alt="UPI QR Code" width={250} height={250} data-ai-hint="qr code"/> : <Skeleton className="h-[250px] w-[250px]" />}<div><p className="text-sm text-muted-foreground">Or pay to:</p>{paymentSettings ? <p className="font-semibold text-lg">{paymentSettings.upiId}</p> : <Skeleton className="h-6 w-48 mt-1" />}</div><Separator /><div className="w-full text-center"><p className="text-muted-foreground">Amount</p><p className="text-4xl font-bold text-primary">Rs.{grandTotal.toFixed(2)}</p></div></CardContent><CardFooter className="flex-col gap-4"><Button onClick={() => finalizeOrder(pendingOrderData!)} disabled={isLoading} className="w-full">{isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying...</> : <><CheckCircle className="mr-2 h-5 w-5"/>I Have Paid</>}</Button><Button variant="outline" onClick={() => setCheckoutStep('details')} disabled={isLoading} className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button></CardFooter></Card></div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold text-center">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card><CardHeader><CardTitle>Shipping & Payment</CardTitle></CardHeader><form onSubmit={handleProceedToPayment}><CardContent className="space-y-6"><div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required /></div>{savedAddresses.length > 0 && <div className="space-y-2"><Label>Saved Addresses</Label><Select value={selectedAddressId} onValueChange={handleAddressSelectChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value={ADD_NEW_ADDRESS_VALUE}>Enter new address</SelectItem>{savedAddresses.map(addr=><SelectItem key={addr.id} value={addr.id}>{`${addr.fullName}: ${addr.street}, ${addr.city}`}</SelectItem>)}</SelectContent></Select></div>}<div className="space-y-2"><Label>Street</Label><Input name="address" value={formData.address} onChange={handleInputChange} required /></div><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>City</Label><Input name="city" value={formData.city} onChange={handleInputChange} required /></div><div className="space-y-2"><Label>Pin Code</Label><Input name="pinCode" value={formData.pinCode} onChange={handleInputChange} required /></div></div><div className="space-y-2"><Label>Phone</Label><Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required /></div><Separator /><div className="space-y-2"><Label>Payment</Label><RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}><Label className="flex items-center space-x-3 p-3 border rounded-md"><RadioGroupItem value="UPI" /><CreditCard className="h-5 w-5 text-primary mx-2" /><span>UPI</span></Label><Label className="flex items-center space-x-3 p-3 border rounded-md"><RadioGroupItem value="Cash on Delivery" /><Wallet className="h-5 w-5 text-primary mx-2" /><span>Cash on Delivery</span></Label></RadioGroup></div></CardContent><CardFooter><Button type="submit" disabled={isLoading || cartItems.length === 0} className="w-full">{isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PackageCheck className="mr-2 h-5 w-5" />} Place Order (Rs.{grandTotal.toFixed(2)})</Button></CardFooter></form></Card>
        <Card><CardHeader><CardTitle>Order Summary</CardTitle><CardDescription>{getCartItemCount()} item(s)</CardDescription></CardHeader><CardContent className="space-y-4">{cartItems.length > 0 ? <div className="max-h-96 overflow-y-auto pr-2 space-y-3">{cartItems.map(item => <CartItemCard key={item.id} item={item} />)}</div> : <p>Cart is empty.</p>}<Separator /><div className="space-y-2 text-lg"><div className="flex justify-between"><span>Subtotal:</span><span>Rs.{subTotal.toFixed(2)}</span></div><div className="flex justify-between text-sm"><span>Delivery:</span><span>Rs.{deliveryFee.toFixed(2)}</span></div><div className="flex justify-between text-sm"><span>Taxes:</span><span>Rs.{estimatedTax.toFixed(2)}</span></div><Separator /><div className="flex justify-between font-bold text-primary text-xl"><span>Total:</span><span>Rs.{grandTotal.toFixed(2)}</span></div></div></CardContent><CardFooter><Button variant="outline" onClick={() => router.push('/')} className="w-full"><Home className="mr-2 h-4 w-4" /> Continue Shopping</Button></CardFooter></Card>
      </div>
    </div>
  );
}
