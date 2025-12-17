
"use client";

import { useState, type FormEvent, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle, ShieldCheck, QrCode, ArrowLeft, Loader2, PackageCheck, Phone, MapPin, AlertCircle, Gift, Tag } from 'lucide-react';
import type { Order, Address as AddressType, PaymentSettings, CartItem, User } from '@/lib/types';
import { placeOrder, getAddresses, getPaymentSettings, deleteAddress, setDefaultAddress, updateAddress, getUserProfile, getOrderById, updateOrderPaymentDetails, deleteOrder as deleteOrderFromDb } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import AnimatedPlateSpinner from '@/components/icons/AnimatedPlateSpinner';
import AddressFormDialog from '@/components/AddressFormDialog';
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


declare global { interface Window { Razorpay: any; } }

export default function CheckoutPage() {
  const { cartItems, getCartTotal, getCartSubtotal, getDiscountAmount, clearCart, getCartItemCount, isOrderingAllowed, setIsTimeGateDialogOpen, appliedCoupon } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [finalizedOrderId, setFinalizedOrderId] = useState<string | null>(null);
  
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressType | null>(null);
  
  const [addressToDelete, setAddressToDelete] = useState<AddressType | null>(null);
  const [isDeleteAddressDialogOpen, setIsDeleteAddressDialogOpen] = useState(false);
  
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isServiceable, setIsServiceable] = useState(true); 
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const pendingOrderIdRef = useRef<string | null>(null);


  const subTotal = getCartSubtotal();
  const discountAmount = getDiscountAmount();
  const totalAfterDiscount = getCartTotal();

  const totalTax = cartItems.reduce((acc, item) => {
    const itemTax = item.price * (item.taxRate || 0);
    return acc + (itemTax * item.quantity);
  }, 0);
  
  const grandTotal = totalAfterDiscount + deliveryFee + totalTax;

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
  
  const createPendingOrder = useCallback(async () => {
    if (!user || cartItems.length === 0 || !selectedAddressId || pendingOrderIdRef.current) return;

    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (!selectedAddress) return;

    const newOrderData: Omit<Order, 'id'> = {
        userId: user.uid,
        userEmail: user.email || 'N/A',
        customerName: selectedAddress.fullName,
        date: new Date().toISOString(),
        status: 'Payment Pending',
        total: grandTotal,
        items: cartItems.map(item => ({ ...item })),
        shippingAddress: `${selectedAddress.street}, ${selectedAddress.village || ''}, ${selectedAddress.city}, ${selectedAddress.pinCode}`.replace(/, ,/g, ','),
        shippingLat: selectedAddress.lat,
        shippingLng: selectedAddress.lng,
        paymentMethod: 'Razorpay',
        customerPhone: selectedAddress.phone,
        deliveryConfirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
        deliveryFee: deliveryFee,
        totalTax: totalTax,
        couponCode: appliedCoupon?.code,
        discountAmount: discountAmount
    };

    try {
        const pendingOrder = await placeOrder(newOrderData);
        pendingOrderIdRef.current = pendingOrder.id;
    } catch (error) {
        console.error("Failed to create pending order", error);
        toast({ title: "Checkout Error", description: "Could not initialize checkout. Please try again.", variant: "destructive" });
    }
}, [user, cartItems, selectedAddressId, grandTotal, deliveryFee, totalTax, appliedCoupon, addresses, discountAmount]);


  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (getCartItemCount() === 0 && !showSuccessScreen) { router.replace('/'); return; }
    if (!isOrderingAllowed) { setIsTimeGateDialogOpen(true); router.replace('/'); return; }
    loadPageData();
  }, [isAuthenticated, isAuthLoading, user, getCartItemCount, router, showSuccessScreen, loadPageData, isOrderingAllowed, setIsTimeGateDialogOpen]);
  
  useEffect(() => {
    if (!isDataLoading && addresses.length > 0 && selectedAddressId) {
        if (!pendingOrderIdRef.current) {
            createPendingOrder();
        }
    }
    // Cleanup function to delete pending order on unmount
    return () => {
      if (pendingOrderIdRef.current) {
        deleteOrderFromDb(pendingOrderIdRef.current);
        pendingOrderIdRef.current = null;
      }
    };
  }, [isDataLoading, addresses, selectedAddressId, createPendingOrder]);

  useEffect(() => {
    if (!paymentSettings || !userProfile) {
        setDeliveryFee(0);
        return;
    }

    const isFirstOrder = userProfile.hasCompletedFirstOrder === false;
    const feeIsEnabled = paymentSettings.isDeliveryFeeEnabled;
    const isOrderAboveThreshold = subTotal >= 300;

    if (!feeIsEnabled || isFirstOrder || isOrderAboveThreshold) {
        setDeliveryFee(0);
    } else {
        setDeliveryFee(paymentSettings.fixedDeliveryFee || 25);
    }

  }, [subTotal, userProfile, paymentSettings]);


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

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAddressId || !pendingOrderIdRef.current) {
        toast({ title: "Address or Order Required", description: "Please select an address and ensure order is initialized.", variant: "destructive" });
        return;
    }
    
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    if (!selectedAddress) {
        toast({ title: "Address Error", description: "Could not find the selected address. Please try again.", variant: "destructive" });
        return;
    }
    
    setIsProcessingPayment(true);

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!keyId || keyId.startsWith('REPLACE_WITH_')) {
      toast({ title: "Configuration Error", description: "Razorpay client key is not set.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({ title: "Payment Error", description: "Could not load payment gateway.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    try {
        const orderResponse = await fetch('/api/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: grandTotal, 
                user,
                cartItems,
                shippingAddress: selectedAddress,
                deliveryFee,
                totalTax,
                coupon: appliedCoupon,
                firebaseOrderId: pendingOrderIdRef.current, // Pass the pending order ID
            }),
        });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }
      const razorpayOrder = await orderResponse.json();
      
      const paymentObject = new window.Razorpay({
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: paymentSettings?.merchantName || "Rasoi Xpress",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: (response: any) => {
            setIsFinalizing(true);
            const orderIdToFinalize = pendingOrderIdRef.current;
            pendingOrderIdRef.current = null; // Prevent deletion
            
            updateOrderPaymentDetails(orderIdToFinalize!, {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                status: 'Order Placed',
            }).then(() => {
                setTimeout(() => {
                    clearCart();
                    setFinalizedOrderId(response.razorpay_order_id);
                    setShowSuccessScreen(true);
                    setIsFinalizing(false);
                    setTimeout(() => {
                        router.push(`/my-orders`);
                    }, 8000);
                }, 3000); 
            });
        },
        modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
              toast({ title: "Payment Cancelled", variant: "destructive" });
            }
        },
        prefill: { name: selectedAddress.fullName, email: user?.email, contact: selectedAddress.phone },
        theme: { color: "#E64A19" },
      });

      paymentObject.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        toast({ title: "Payment Failed", description: response.error.description || 'An unknown error occurred.', variant: "destructive" });
        setIsProcessingPayment(false);
      });
      paymentObject.open();

    } catch (error: any) {
      console.error("Error during Razorpay process:", error);
      toast({ title: "Error", description: error.message || "Could not initiate payment.", variant: "destructive" });
      setIsProcessingPayment(false);
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
      setIsAddressFormOpen(true);
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

  const handleNewAddressAdded = (newAddressId: string) => {
    loadPageData().then(() => {
      setSelectedAddressId(newAddressId);
    });
  };

  if (isAuthLoading || !isAuthenticated || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Loading..." : "Getting ready..."}</p>
      </div>
    );
  }
  
  if (isFinalizing) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <h1 className="text-2xl font-headline font-bold text-primary mt-4">Payment Successful!</h1>
        <p className="text-lg text-muted-foreground">Finalizing your order, please wait...</p>
      </div>
    );
  }

  if (showSuccessScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4">
        <CheckCircle className="h-24 w-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Order is Placed!</h1>
        <p className="text-lg text-muted-foreground max-w-md">You can track your order on the "My Orders" page.</p>
        
        <Card className="mt-6 text-center p-4 border-dashed">
            <CardHeader className="p-2">
                <CardTitle className="text-lg text-primary">
                    <ShieldCheck className="mr-2 h-5 w-5 inline"/>
                    Your Razorpay Order ID
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <p className="text-2xl font-bold tracking-widest break-all">#{finalizedOrderId?.slice(-8)}</p>
                <p className="text-xs text-muted-foreground mt-2">Use this code for any payment inquiries.</p>
            </CardContent>
        </Card>

        <div className="mt-8 flex gap-4">
            <Button onClick={() => router.push(`/my-orders`)} size="lg">Track My Order</Button>
            <Button onClick={() => router.push('/')} variant="outline" size="lg">Continue Shopping</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-6">Redirecting automatically...</p>
      </div>
    );
  }

  const isProcessingForm = isProcessingPayment;
  const isFirstOrder = userProfile?.hasCompletedFirstOrder === false;

  return (
    <>
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="space-y-8">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-left">Checkout</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
                <CardDescription>Select an address or add a new one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Button type="button" variant="outline" className="w-full h-12 text-lg" onClick={() => setIsAddressFormOpen(true)}>
                    <MapPin className="mr-2 h-5 w-5" />
                    Add New Address
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
                 {isServiceable && !paymentSettings?.isDeliveryFeeEnabled && (
                    <Alert>
                        <Gift className="h-4 w-4" />
                        <AlertTitleElement>Free Delivery Unlocked!</AlertTitleElement>
                        <AlertDescription>
                            All delivery fees are currently waived as part of a special promotion.
                        </AlertDescription>
                    </Alert>
                )}
                {isServiceable && paymentSettings?.isDeliveryFeeEnabled && isFirstOrder && (
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
                    {appliedCoupon && discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span className='flex items-center gap-1'><Tag className="h-4 w-4" />Coupon '{appliedCoupon.code}'</span>
                          <span>- Rs.{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm"><span>Taxes:</span><span>Rs.{totalTax.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm">
                        <span>Delivery Fee:</span>
                        <span className="flex items-center">
                            {isServiceable ? (
                                deliveryFee > 0 ? (
                                    `Rs.${deliveryFee.toFixed(2)}`
                                ) : (
                                    <span className="font-semibold text-green-600">FREE</span>
                                )
                            ) : (
                                'Not available'
                            )}
                        </span>
                    </div>
                     
                    <Separator />
                    <div className="flex justify-between font-bold text-primary text-xl"><span>Total:</span><span>Rs.{grandTotal.toFixed(2)}</span></div>
                </div>
                 <Button onClick={handlePlaceOrder} disabled={isProcessingForm || !selectedAddressId || !isServiceable} className="w-full">
                    {isProcessingForm ? <Loader2 className="animate-spin" /> : <CreditCard className="mr-2" />} 
                    {isProcessingForm ? 'Processing...' : `Pay Rs.${grandTotal.toFixed(2)}`}
                </Button>
            </CardContent>
         </Card>
      </div>

    </div>
    <AddressFormDialog 
        isOpen={isAddressFormOpen} 
        onOpenChange={setIsAddressFormOpen} 
        onSaveSuccess={handleNewAddressAdded}
        addressToEdit={addressToEdit}
     />
     
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

    