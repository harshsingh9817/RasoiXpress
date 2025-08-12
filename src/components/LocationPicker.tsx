
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addAddress, getAddresses, updateAddress, getPaymentSettings } from '@/lib/data';
import type { Address } from '@/lib/types';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { Loader2, MapPin, User, Phone, LocateFixed, AlertTriangle } from 'lucide-react';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 26.1555,
  lng: 83.7919
};

const MAP_SCRIPT_ID = "gomaps-pro-api-script";

interface LocationPickerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSaveSuccess: (newAddressId?: string) => void;
    addressToEdit?: Address | null;
}

// This function now ALWAYS assumes the input is a key and builds the URL.
const buildScriptUrl = (apiKey: string): string => {
    if (!apiKey) return "";
    // If it looks like a full URL, use it, otherwise build it. This provides a fallback but prioritizes key-based construction.
    if (apiKey.startsWith('http')) {
        return apiKey;
    }
    return `https://maps.gomaps.pro/maps/api/js?key=${apiKey}&libraries=places`;
};

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!src) {
            reject(new Error("Map script URL is empty."));
            return;
        }
        const existingScript = document.getElementById(id);
        if (existingScript) {
            existingScript.remove();
        }

        if (window.google && window.google.maps) {
            return resolve();
        }

        const script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load map script. The API key may be invalid or the URL incorrect.`));
        document.head.appendChild(script);
    });
};


export default function LocationPicker({ isOpen, onOpenChange, onSaveSuccess, addressToEdit }: LocationPickerProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google?.maps) return;

        setIsLoading(false);

        const initialCenter = addressToEdit && addressToEdit.lat && addressToEdit.lng
            ? { lat: addressToEdit.lat, lng: addressToEdit.lng }
            : defaultCenter;

        const map = new window.google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 17,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
        });
        mapInstanceRef.current = map;

    }, [addressToEdit]);

    useEffect(() => {
        if (isOpen) {
            if (addressToEdit) {
                setFullName(addressToEdit.fullName || user?.displayName || '');
                setPhone(addressToEdit.phone || '');
            } else {
                setFullName(user?.displayName || '');
                setPhone('');
            }
        }
    }, [user, isOpen, addressToEdit]);
    
    useEffect(() => {
        if (!isOpen) {
            setIsLoading(true);
            setError(null);
            return;
        }
        let isMounted = true;
        
        const fetchAndLoadMap = async () => {
            try {
                const settings = await getPaymentSettings();
                const mapApiKey = settings?.mapApiUrl; // This field now holds the key
                if (!mapApiKey) {
                    throw new Error("Map API Key is not configured in admin settings.");
                }
                setApiKey(mapApiKey);
                
                const fullApiUrl = buildScriptUrl(mapApiKey);
                await loadScript(fullApiUrl, MAP_SCRIPT_ID);
                if (isMounted) initMap();
            } catch (err: any) {
                console.error(err);
                if (isMounted) {
                    setError(err.message || "Could not load map script.");
                    toast({ title: "Map Error", description: err.message, variant: "destructive" });
                    setIsLoading(false);
                }
            }
        };

        fetchAndLoadMap();
        
        return () => { isMounted = false; }
        
    }, [isOpen, initMap, toast]);

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newCenter = new window.google.maps.LatLng(latitude, longitude);
                    mapInstanceRef.current?.setCenter(newCenter);
                    mapInstanceRef.current?.setZoom(18);
                },
                () => {
                    toast({
                        title: "Location Access Denied",
                        description: "Please enable location services in your browser settings to use this feature.",
                        variant: "destructive"
                    });
                }
            );
        } else {
            toast({ title: "Geolocation not supported", variant: "destructive" });
        }
    };

    const handleSaveAddress = async () => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in to save an address.", variant: "destructive" });
            return;
        }
        if (!fullName || !phone) {
            toast({ title: "Missing Details", description: "Please fill in your name and phone number.", variant: "destructive" });
            return;
        }
         if (!/^\d{10}$/.test(phone)) {
            toast({ title: "Invalid Phone Number", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
            return;
        }
        if (!mapInstanceRef.current) {
            toast({ title: "Map Error", description: "The map is not initialized. Please try again.", variant: "destructive" });
            return;
        }
        if (!apiKey) {
            toast({ title: "Configuration Error", description: "Map API Key could not be loaded.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const currentPosition = mapInstanceRef.current.getCenter();
            if (!currentPosition) {
                throw new Error('Could not get map center position.');
            }
            const lat = currentPosition.lat();
            const lng = currentPosition.lng();

            const response = await fetch('/api/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng, apiKey }), // Pass apiKey directly
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get address.');
            }
            
            if (addressToEdit) {
                 const updatedAddressData: Address = {
                    ...addressToEdit,
                    fullName,
                    phone,
                    street: data.street || data.formattedAddress,
                    village: data.village || '',
                    city: data.city || '',
                    pinCode: data.pinCode || '',
                    lat,
                    lng,
                 };
                 await updateAddress(user.uid, updatedAddressData);
                 toast({ title: "Address Updated!", description: "Your address has been successfully updated." });
                 onSaveSuccess();
            } else {
                const existingAddresses = await getAddresses(user.uid);

                const addressToSave: Omit<Address, 'id'> = {
                    fullName,
                    type: existingAddresses.length === 0 ? 'Home' : 'Other',
                    street: data.street || data.formattedAddress,
                    village: data.village || '',
                    city: data.city || '',
                    pinCode: data.pinCode || '',
                    phone,
                    alternatePhone: '',
                    isDefault: existingAddresses.length === 0,
                    lat: lat,
                    lng: lng,
                };

                const newAddress = await addAddress(user.uid, addressToSave);

                toast({ title: "Address Saved!", description: "The new address has been added to your profile." });
                onSaveSuccess(newAddress.id);
            }
            
            onOpenChange(false);

        } catch (error: any) {
            console.error("Save address error:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{addressToEdit ? 'Edit Address' : 'Add a New Address'}</DialogTitle>
                    <DialogDescription>
                        Pan the map to position the pin at your delivery location, then confirm your details below.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="relative h-[300px] w-full rounded-md overflow-hidden border">
                         {isLoading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                                <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                                <p className="text-muted-foreground mt-4">Loading Map...</p>
                            </div>
                        )}
                        {error && !isLoading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-destructive/10 backdrop-blur-sm rounded-lg p-4 text-center">
                                <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                                <p className="text-destructive font-semibold">{error}</p>
                                <p className="text-destructive/80 text-sm mt-1">Please check the API Key in the admin settings.</p>
                                <Button variant="destructive" size="sm" asChild className="mt-4">
                                    <Link href="/admin/payment">Go to Settings</Link>
                                </Button>
                            </div>
                        )}
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <MapPin className="h-10 w-10 text-primary drop-shadow-lg" style={{ transform: 'translateY(-50%)' }} />
                        </div>
                        {!isLoading && !error && (
                            <Button
                                type="button"
                                size="icon"
                                className="absolute bottom-4 right-4 z-20 shadow-lg"
                                onClick={handleUseCurrentLocation}
                                aria-label="Use current location"
                            >
                                <LocateFixed className="h-5 w-5" />
                            </Button>
                        )}
                        <div ref={mapRef} style={containerStyle} />
                    </div>
                    <div className="space-y-3">
                        <Label>Confirm Your Details</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" required />
                        </div>
                        <div className="relative">
                           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input type="tel" placeholder="10-digit Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" required pattern="\\d{10}" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveAddress} disabled={isLoading || isProcessing || !!error}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Saving...' : 'Save Address'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
