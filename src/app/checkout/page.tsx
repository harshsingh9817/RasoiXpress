
"use client";

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle, ShieldCheck, QrCode, ArrowLeft, Loader2, PackageCheck, Phone, MapPin, AlertCircle, Gift } from 'lucide-react';
import type { Order, Address as AddressType, PaymentSettings } from '@/lib/types';
import { placeOrder, getAddresses, getPaymentSettings, deleteAddress, setDefaultAddress, updateAddress, getUserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import LocationPicker from '@/components/LocationPicker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle as AlertTitleElement } from '@/components/ui/alert';
import { Dialog, DialogFooter as EditDialogFooter, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';


const RESTAURANT_COORDS = { lat: 25.970960, lng: 83.873773 };

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};


declare global { interface Window { Razorpay: any; } }

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart, getCartItemCount, isOrderingAllowed, setIsTimeGateDialogOpen } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'address' | 'summary' | 'success'>('address');
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const [addressToEdit, setAddressToEdit] = useState<AddressType | null>(null);
  const [isEditAddressDialogOpen, setIsEditAddressDialogOpen] = useState(false);
  const [editAddressFormData, setEditAddressFormData] = useState<Partial<AddressType>>({});
  
  const [addressToDelete, setAddressToDelete] = useState<AddressType | null>(null);
  const [isDeleteAddressDialogOpen, setIsDeleteAddressDialogOpen] = useState(false);
  
  // New state for delivery logic & first order
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [isServiceable, setIsServiceable] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);


  const subTotal = getCartTotal();
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

        const [userAddresses, profile] = await Promise.all([
            getAddresses(user.uid),
            getUserProfile(user.uid)
        ]);
        
        setUserProfile(profile);

        const sortedAddresses = userAddresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        setAddresses(sortedAddresses);

        if (sortedAddresses.length > 0 && !selectedAddressId) {
            const defaultAddress = sortedAddresses.find(addr => addr.isDefault) || sortedAddresses[0];
            setSelectedAddressId(defaultAddress.id);
        } else if (sortedAddresses.length === 0) {
            setSelectedAddressId(null);
        }
    } catch (error) {
        console.error("Failed to load checkout data", error);
        toast({ title: "Error", description: "Could not load checkout data.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [user, toast, selectedAddressId]);
  
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (getCartItemCount() === 0 && currentStep !== 'success') { router.replace('/'); return; }
    if (!isOrderingAllowed) { setIsTimeGateDialogOpen(true); router.replace('/'); return; }
    loadPageData();
  }, [isAuthenticated, isAuthLoading, user, getCartItemCount, router, currentStep, loadPageData, isOrderingAllowed, setIsTimeGateDialogOpen]);

  useEffect(() => {
    if (!selectedAddressId) {
        setDistance(null);
        setDeliveryFee(0);
        setIsServiceable(true);
        return;
    }

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    
    if (selectedAddress && typeof selectedAddress.lat === 'number' && typeof selectedAddress.lng === 'number') {
        const dist = getDistance(
            RESTAURANT_COORDS.lat,
            RESTAURANT_COORDS.lng,
            selectedAddress.lat,
            selectedAddress.lng
        );
        setDistance(dist);

        if (dist > 5) {
            setIsServiceable(false);
            setDeliveryFee(0);
        } else {
            setIsServiceable(true);
            const isFirstOrder = userProfile?.hasCompletedFirstOrder === false;
            
            if (isFirstOrder) {
                setDeliveryFee(0); // Free delivery for the first order
            } else if (subTotal > 0 && subTotal < 300) {
                const fee = Math.round(dist * 25);
                setDeliveryFee(fee);
            } else {
                setDeliveryFee(0); // Free delivery for orders >= 300
            }
        }
    } else {
        setDistance(null);
        setDeliveryFee(0);
        setIsServiceable(false);
    }
  }, [selectedAddressId, addresses, subTotal, userProfile]);

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

  const handleRazorpayPayment = async (orderData: Omit<Order, 'id'>, selectedAddress: AddressType) => {
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
        prefill: { name: selectedAddress.fullName, email: user?.email, contact: selectedAddress.phone },
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
    if (!user || !selectedAddressId) {
        toast({ title: "Address Required", description: "Please select a delivery address.", variant: "destructive" });
        return;
    }
    
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (!selectedAddress) {
        toast({ title: "Address Error", description: "Could not find the selected address. Please try again.", variant: "destructive" });
        return;
    }
    
    const villagePart = selectedAddress.village ? `${selectedAddress.village}, ` : '';
    const newOrderData: Omit<Order, 'id'> = {
        userId: user.uid,
        userEmail: user.email || 'N/A',
        customerName: selectedAddress.fullName,
        date: new Date().toISOString(),
        status: 'Order Placed',
        total: grandTotal,
        items: cartItems.map(item => ({ ...item })),
        shippingAddress: `${selectedAddress.street}, ${villagePart}${selectedAddress.city}, ${selectedAddress.pinCode}`,
        shippingLat: selectedAddress.lat,
        shippingLng: selectedAddress.lng,
        paymentMethod: paymentSettings?.isRazorpayEnabled ? 'Razorpay' : 'Cash on Delivery',
        customerPhone: selectedAddress.phone,
        deliveryConfirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        deliveryFee: deliveryFee,
        totalTax: totalTax
    };
    
    if (paymentSettings?.isRazorpayEnabled) {
        handleRazorpayPayment(newOrderData, selectedAddress);
    } else {
        finalizeOrder(newOrderData);
    }
  };

  const handleSetDefault = async (addressId: string) => {
      if (!user) return;
      await setDefaultAddress(user.uid, addressId);
      await loadPageData();
      toast({ title: "Default address updated!" });
  };
  
  const handleOpenEditDialog = (address: AddressType) => {
      setAddressToEdit(address);
      setEditAddressFormData(address);
      setIsEditAddressDialogOpen(true);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditAddressFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateAddress = async (e: FormEvent) => {
      e.preventDefault();
      if (!user || !addressToEdit) return;
      await updateAddress(user.uid, { ...addressToEdit, ...editAddressFormData });
      await loadPageData();
      setIsEditAddressDialogOpen(false);
      toast({ title: "Address updated successfully!" });
  };

  const handleOpenDeleteDialog = (address: AddressType) => {
    setAddressToDelete(address);
    setIsDeleteAddressDialogOpen(true);
  };

  const confirmDeleteAddress = async () => {
    if (!user || !addressToDelete) return;
    await deleteAddress(user.uid, addressToDelete.id);
    await loadPageData();
    setIsDeleteAddressDialogOpen(false);
    toast({ title: "Address removed." });
  };

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
  const isFirstOrder = userProfile?.hasCompletedFirstOrder === false;

  return (
    <>
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="space-y-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-left">Checkout</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
                <CardDescription>Select an address or add a new one using the map.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Button type="button" variant="outline" className="w-full h-12 text-lg" onClick={() => setIsMapOpen(true)}>
                    <MapPin className="mr-2 h-5 w-5" />
                    Add New Address via Map
                </Button>

                <Separator className="my-6" />
                
                <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId} className="space-y-4">
                    {addresses.length > 0 ? (
                        addresses.map(address => (
                            <Label key={address.id} htmlFor={address.id} className={cn("flex flex-col p-4 border rounded-lg cursor-pointer transition-all", selectedAddressId === address.id && "border-primary ring-2 ring-primary")}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem value={address.id} id={address.id} />
                                        <div className="font-semibold">{address.fullName} {address.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{address.type}</div>
                                </div>
                                <div className="pl-8 pt-2 text-sm text-muted-foreground">
                                    <p>{address.street}, {address.village}</p>
                                    <p>{address.city}, {address.pinCode}</p>
                                    <p className="flex items-center mt-1"><Phone className="mr-2 h-3 w-3" /> {address.phone}</p>
                                </div>
                                <div className="pl-8 pt-3 flex gap-2 items-center">
                                    {!address.isDefault && (
                                        <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={(e) => {e.preventDefault(); handleSetDefault(address.id)}}>Set as Default</Button>
                                    )}
                                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={(e) => {e.preventDefault(); handleOpenEditDialog(address)}}>Edit</Button>
                                    {!address.isDefault && (
                                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={(e) => {e.preventDefault(); handleOpenDeleteDialog(address)}}>Delete</Button>
                                    )}
                                </div>
                            </Label>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No addresses found. Please add one to continue.</p>
                    )}
                </RadioGroup>
            </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6 sticky top-24">
         <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 {!isServiceable && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitleElement>Out of Delivery Area</AlertTitleElement>
                      <AlertDescription>
                        Sorry, this location is more than 5km away. We cannot deliver to this address.
                      </AlertDescription>
                    </Alert>
                )}
                {isFirstOrder && isServiceable && (
                    <Alert>
                        <Gift className="h-4 w-4" />
                        <AlertTitleElement>First Order Bonus!</AlertTitleElement>
                        <AlertDescription>
                            Congratulations! Your first delivery is on the house.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2 text-lg">
                    <div className="flex justify-between"><span>Subtotal:</span><span>Rs.{subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span>Taxes:</span><span>Rs.{totalTax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm">
                        <span>Delivery Fee:</span>
                        <span>
                            {isFirstOrder && isServiceable ? (
                                <span className="font-semibold text-green-600">FREE</span>
                            ) : deliveryFee > 0 ? (
                                `Rs.${deliveryFee.toFixed(2)}`
                            ) : (
                                <span className="font-semibold text-green-600">FREE</span>
                            )}
                        </span>
                    </div>
                     {distance !== null && <p className="text-xs text-muted-foreground text-right">Distance: {distance.toFixed(2)} km</p>}

                    <Separator />
                    <div className="flex justify-between font-bold text-primary text-xl"><span>Total:</span><span>Rs.{grandTotal.toFixed(2)}</span></div>
                </div>
                 <Button onClick={handlePlaceOrder} disabled={isProcessing || !selectedAddressId || !isServiceable} className="w-full">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <PackageCheck className="mr-2" />} 
                    {isProcessing ? 'Processing...' : `Place Order`}
                </Button>
            </CardContent>
         </Card>
      </div>

    </div>
    <LocationPicker 
        isOpen={isMapOpen} 
        onOpenChange={setIsMapOpen} 
        onSaveSuccess={loadPageData}
        apiUrl={paymentSettings?.mapApiUrl}
     />
     
    <Dialog open={isEditAddressDialogOpen} onOpenChange={setIsEditAddressDialogOpen}>
      <EditDialogContent>
        <EditDialogHeader>
          <EditDialogTitle>Edit Address</EditDialogTitle>
        </EditDialogHeader>
        <form onSubmit={handleUpdateAddress} className="space-y-4">
          <Input name="fullName" value={editAddressFormData.fullName || ''} onChange={handleEditFormChange} placeholder="Full Name" />
          <Input name="street" value={editAddressFormData.street || ''} onChange={handleEditFormChange} placeholder="House / Street" />
          <Input name="village" value={editAddressFormData.village || ''} onChange={handleEditFormChange} placeholder="Village / Area" />
          <Input name="city" value={editAddressFormData.city || ''} onChange={handleEditFormChange} placeholder="City" />
          <Input name="pinCode" value={editAddressFormData.pinCode || ''} onChange={handleEditFormChange} placeholder="Pin Code" />
          <Input name="phone" value={editAddressFormData.phone || ''} onChange={handleEditFormChange} placeholder="Phone" />
          <EditDialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditAddressDialogOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </EditDialogFooter>
        </form>
      </EditDialogContent>
    </Dialog>

    <AlertDialog open={isDeleteAddressDialogOpen} onOpenChange={setIsDeleteAddressDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this address.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteAddress} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
