
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogFooter as EditDialogFooter, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';


const RESTAURANT_COORDS = { lat: 25.970960, lng: 83.873773 };

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (lat1 === 0 && lon1 === 0) return 0; // Don't calculate distance for manually entered addresses without coords
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
  const { cartItems, getCartTotal, getCartSubtotal, getDiscountAmount, clearCart, getCartItemCount, isOrderingAllowed, setIsTimeGateDialogOpen, appliedCoupon, handleInstantCheckout, isProcessingPayment } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  
  const [addressToEdit, setAddressToEdit] = useState<AddressType | null>(null);
  
  const [addressToDelete, setAddressToDelete] = useState<AddressType | null>(null);
  const [isDeleteAddressDialogOpen, setIsDeleteAddressDialogOpen] = useState(false);

  const loadPageData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
        const userAddresses = await getAddresses(user.uid);
        
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
        toast({ title: "Error", description: "Could not load your addresses.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [user, toast, selectedAddressId]);
  
  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (getCartItemCount() === 0) { router.replace('/'); return; }
    loadPageData();
  }, [isAuthenticated, isAuthLoading, user, getCartItemCount, router, loadPageData]);


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

  const handleOpenAddDialog = () => {
    setAddressToEdit(null);
    setIsAddressFormOpen(true);
  }

  const handleSaveSuccess = (newAddressId?: string) => {
    loadPageData().then(() => {
      if (newAddressId) {
        setSelectedAddressId(newAddressId);
      }
    });
  }

  if (isAuthLoading || !isAuthenticated || isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
        <p className="text-xl text-muted-foreground mt-4">{isAuthLoading ? "Loading..." : "Getting your addresses..."}</p>
      </div>
    );
  }


  return (
    <>
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-headline font-bold text-left">Checkout</h1>
      <p className="text-muted-foreground">Confirm your address and proceed to payment directly from the cart.</p>
      
      <Card>
          <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>Select an address or add a new one. The default address will be used for payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
               <Button type="button" variant="outline" className="w-full h-12 text-lg" onClick={handleOpenAddDialog}>
                  <MapPin className="mr-2 h-5 w-5" />
                  Add a New Address
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
      <div className="text-center mt-6">
        <Button onClick={() => handleInstantCheckout()} disabled={isProcessingPayment || !selectedAddressId}>
          {isProcessingPayment ? <Loader2 className="animate-spin mr-2"/> : <ArrowLeft className="mr-2"/>}
          {isProcessingPayment ? 'Processing...' : 'Back to Cart & Pay'}
        </Button>
      </div>
    </div>
    <AddressFormDialog 
        isOpen={isAddressFormOpen} 
        onOpenChange={setIsAddressFormOpen} 
        onSaveSuccess={handleSaveSuccess}
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
