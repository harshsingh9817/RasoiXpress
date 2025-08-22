
"use client";

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, CheckCircle, ShieldCheck, QrCode, ArrowLeft, Loader2, PackageCheck, Phone, MapPin, AlertCircle, Gift, Tag } from 'lucide-react';
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
  const { cartItems, getCartTotal, getCartSubtotal, getDiscountAmount, clearCart, getCartItemCount, isOrderingAllowed, setIsTimeGateDialogOpen, appliedCoupon } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const [addressToEdit, setAddressToEdit] = useState<AddressType | null>(null);
  const [isEditAddressDialogOpen, setIsEditAddressDialogOpen] = useState(false);
  const [editAddressFormData, setEditAddressFormData] = useState<Partial<AddressType>>({});
  
  const [addressToDelete, setAddressToDelete] = useState<AddressType | null>(null);
  const [isDeleteAddressDialogOpen, setIsDeleteAddressDialogOpen] = useState(false);
  
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [isServiceable, setIsServiceable] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);


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
  
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (getCartItemCount() === 0) { router.replace('/'); return; }
    if (!isOrderingAllowed) { setIsTimeGateDialogOpen(true); router.replace('/'); return; }
    loadPageData();
  }, [isAuthenticated, isAuthLoading, user, getCartItemCount, router, loadPageData, isOrderingAllowed, setIsTimeGateDialogOpen]);

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
        
        const maxDistance = paymentSettings?.deliveryRadiusKm || 5;

        if (dist > maxDistance) {
            setIsServiceable(false);
            setDeliveryFee(0);
            return;
        }

        setIsServiceable(true);
        
        if (paymentSettings?.isDeliveryFeeEnabled === false) {
            setDeliveryFee(0);
            return;
        }

        const isFirstOrder = userProfile?.hasCompletedFirstOrder === false;
        if (isFirstOrder) {
            setDeliveryFee(0);
            return;
        }

        if (subTotal > 0 && subTotal < 300) {
            const fee = Math.round(dist * 25);
            setDeliveryFee(fee);
        } else {
            setDeliveryFee(0);
        }

    } else {
        setDistance(null);
        setDeliveryFee(0);
        setIsServiceable(false);
    }
  }, [selectedAddressId, addresses, subTotal, userProfile, paymentSettings]);

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
    if (!user || !selectedAddressId) {
        toast({ title: "Address Required", description: "Please select a delivery address.", variant: "destructive" });
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
      toast({
        title: "Configuration Error",
        description: "Razorpay client key (NEXT_PUBLIC_RAZORPAY_KEY_ID) is not set. Please contact support.",
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
      
      const villagePart = selectedAddress.village ? `${selectedAddress.village}, ` : '';
      const orderDataForDb: Omit<Order, 'id'> = {
          userId: user.uid,
          userEmail: user.email || 'N/A',
          customerName: selectedAddress.fullName,
          date: new Date().toISOString(),
          status: 'Pending Payment',
          total: grandTotal,
          items: cartItems.map(item => ({ ...item })),
          shippingAddress: `${selectedAddress.street}, ${villagePart}${selectedAddress.city}, ${selectedAddress.pinCode}`,
          shippingLat: selectedAddress.lat,
          shippingLng: selectedAddress.lng,
          paymentMethod: 'Razorpay',
          customerPhone: selectedAddress.phone,
          deliveryFee: deliveryFee,
          totalTax: totalTax,
          razorpayOrderId: razorpayOrder.id,
          couponCode: appliedCoupon?.code,
          discountAmount: discountAmount
      };

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Rasoi Xpress",
        description: "Order Payment",
        image: "https://firebasestorage.googleapis.com/v0/b/rasoi-xpress.appspot.com/o/app-images%2Frasoi-xpress-logo.png?alt=media&token=26223b20-5627-46f9-813c-1b70273a340b",
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          const verificationResponse = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: orderDataForDb
            }),
          });
          const verificationResult = await verificationResponse.json();

          if (verificationResult.success) {
            clearCart();
            router.push(`/my-orders?track=${verificationResult.order.id}`);
          } else {
            toast({ title: "Payment Failed", description: "Payment verification failed. Please contact support.", variant: "destructive" });
            setIsProcessingPayment(false);
          }
        },
        prefill: { name: selectedAddress.fullName, email: user?.email, contact: selectedAddress.phone },
        theme: { color: "#E64A19" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        toast({ title: "Payment Failed", description: response.error.description || 'An unknown error occurred.', variant: "destructive" });
        setIsProcessingPayment(false);
      });
      paymentObject.open();

    } catch (error: any) {
      console.error("Error during Razorpay process:", error);
      toast({ title: "Error", description: error.message || "Could not initiate payment. Please try again.", variant: "destructive" });
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
                        Sorry, this location is more than {paymentSettings?.deliveryRadiusKm || 5}km away. We cannot deliver to this address.
                      </AlertDescription>
                    </Alert>
                )}
                {isServiceable && paymentSettings?.isDeliveryFeeEnabled === false && (
                    <Alert>
                        <Gift className="h-4 w-4" />
                        <AlertTitleElement>Free Delivery Unlocked!</AlertTitleElement>
                        <AlertDescription>
                            All delivery fees are currently waived as part of a special promotion.
                        </AlertDescription>
                    </Alert>
                )}
                {isServiceable && paymentSettings?.isDeliveryFeeEnabled !== false && isFirstOrder && (
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
                        <span>
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
        onSaveSuccess={handleNewAddressAdded}
        addressToEdit={addressToEdit}
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
