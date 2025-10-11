
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addAddress, updateAddress, getAddresses } from "@/lib/data";
import type { Address } from "@/lib/types";
import { useEffect, useState } from "react";
import AnimatedPlateSpinner from "./icons/AnimatedPlateSpinner";
import { MapPin, LocateFixed } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface AddressFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: (newAddressId?: string) => void;
  addressToEdit?: Address | null;
}

const addressSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number."),
  pinCode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code."),
  state: z.string().min(2, "State is required."),
  city: z.string().min(2, "City is required."),
  street: z.string().min(5, "House number, building, and street are required."),
  village: z.string().optional(),
  type: z.enum(["Home", "Work", "Other"]),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function AddressFormDialog({
  isOpen,
  onOpenChange,
  onSaveSuccess,
  addressToEdit,
}: AddressFormDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
        type: "Home",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (addressToEdit) {
        form.reset({
            fullName: addressToEdit.fullName,
            phone: addressToEdit.phone,
            pinCode: addressToEdit.pinCode,
            state: addressToEdit.state,
            city: addressToEdit.city,
            street: addressToEdit.street,
            village: addressToEdit.village || "",
            type: addressToEdit.type,
        });
        if (addressToEdit.lat && addressToEdit.lng) {
            setCoords({ lat: addressToEdit.lat, lng: addressToEdit.lng });
        }
      } else {
        form.reset({
            fullName: user?.displayName || "",
            phone: "",
            pinCode: "",
            state: "Uttar Pradesh",
            city: "Nagra",
            street: "",
            village: "",
            type: "Home",
        });
        setCoords(null);
      }
    }
  }, [isOpen, addressToEdit, user, form]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
        toast({ title: 'Geolocation is not supported by your browser.', variant: 'destructive' });
        return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setCoords({ lat: latitude, lng: longitude });
            try {
                const response = await fetch('/api/reverse-geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat: latitude, lng: longitude, apiKey: process.env.NEXT_PUBLIC_MAPPLS_API_KEY }),
                });
                if (!response.ok) throw new Error('Failed to fetch address');
                const data = await response.json();
                form.reset({
                    ...form.getValues(),
                    street: data.street,
                    village: data.village,
                    city: data.city,
                    state: data.state,
                    pinCode: data.pinCode,
                });
            } catch (err) {
                toast({ title: 'Could not fetch address details.', variant: 'destructive' });
            } finally {
                setIsFetchingLocation(false);
            }
        },
        () => {
            toast({ title: 'Unable to retrieve your location.', description: 'Please enable location services.', variant: 'destructive' });
            setIsFetchingLocation(false);
        }
    );
  };


  const onSubmit: SubmitHandler<AddressFormValues> = async (data) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to save an address.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
        if (addressToEdit) {
            const updatedAddress: Address = {
                ...addressToEdit,
                ...data,
                lat: coords?.lat || 0,
                lng: coords?.lng || 0,
            };
            await updateAddress(user.uid, updatedAddress);
            toast({ title: "Address Updated!", description: "Your address has been successfully updated." });
            onSaveSuccess();
        } else {
            const existingAddresses = await getAddresses(user.uid);
            const newAddress: Omit<Address, 'id'> = {
                ...data,
                isDefault: existingAddresses.length === 0,
                lat: coords?.lat || 0,
                lng: coords?.lng || 0,
            };
            const addedAddress = await addAddress(user.uid, newAddress);
            toast({ title: "Address Saved!", description: "The new address has been added to your profile." });
            onSaveSuccess(addedAddress.id);
        }
        onOpenChange(false);
    } catch (error: any) {
        console.error("Address save error:", error);
        toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{addressToEdit ? "Edit Address" : "Add a New Address"}</DialogTitle>
          <DialogDescription>
            Please fill in your delivery details manually.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                
                <Alert>
                    <LocateFixed className="h-4 w-4" />
                    <AlertTitle>Auto-fill Address</AlertTitle>
                    <AlertDescription>
                        Use your device's GPS to fill the fields below automatically.
                    </AlertDescription>
                    <Button type="button" onClick={handleGetCurrentLocation} disabled={isFetchingLocation} className="mt-3 w-full">
                        {isFetchingLocation ? <AnimatedPlateSpinner className="h-5 w-5 mr-2" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {isFetchingLocation ? 'Fetching...' : 'Get Current Location'}
                    </Button>
                </Alert>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>10-digit mobile number *</FormLabel><FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem><FormLabel>House No., Building Name, Street *</FormLabel><FormControl><Input placeholder="e.g. Hanuman Mandir, Ghosi More" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="village" render={({ field }) => (
                        <FormItem><FormLabel>Village, Landmark (Optional)</FormLabel><FormControl><Input placeholder="e.g. Near Post Office" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>Town/City *</FormLabel><FormControl><Input placeholder="e.g. Nagra" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="pinCode" render={({ field }) => (
                        <FormItem><FormLabel>PIN Code *</FormLabel><FormControl><Input placeholder="e.g. 221711" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>State *</FormLabel><FormControl><Input placeholder="e.g. Uttar Pradesh" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Address Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Home">Home</SelectItem>
                                <SelectItem value="Work">Work</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
                />

                <DialogFooter className="pt-4 sticky bottom-0 bg-background py-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <AnimatedPlateSpinner className="w-6 h-6 mr-2" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {isSubmitting ? "Saving..." : "Save Address"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
