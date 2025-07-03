
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { addAddress, getAddresses } from '@/lib/data';
import type { Address } from '@/lib/types';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { Loader2, MapPin, User, Home, Phone } from 'lucide-react';

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
    onSaveSuccess: () => void;
    apiUrl: string | undefined;
}

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById(id);
      if (existingScript) {
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }
  
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
};


export default function LocationPicker({ isOpen, onOpenChange, onSaveSuccess, apiUrl }: LocationPickerProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [street, setStreet] = useState('');
    const [phone, setPhone] = useState('');

    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google?.maps) return;

        setIsLoading(false);

        const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 15,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
        });
        mapInstanceRef.current = map;

    }, []);

    useEffect(() => {
        if (user?.displayName) {
            setFullName(user.displayName);
        }
    }, [user, isOpen]);
    
    useEffect(() => {
        if (!isOpen) {
            setIsLoading(true);
            setStreet('');
            setPhone('');
            return;
        }
        let isMounted = true;

        if (!apiUrl) {
            setIsLoading(false);
            return;
        }
        
        loadScript(apiUrl, MAP_SCRIPT_ID)
            .then(() => {
                if (isMounted) initMap();
            })
            .catch(err => {
                console.error(err);
                if (isMounted) {
                    toast({ title: "Error", description: "Could not load map script.", variant: "destructive" });
                    setIsLoading(false);
                }
            });
        
        return () => { isMounted = false; }
        
    }, [isOpen, apiUrl, initMap, toast]);

    const handleSaveAddress = async () => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in to save an address.", variant: "destructive" });
            return;
        }
        if (!fullName || !street || !phone) {
            toast({ title: "Missing Details", description: "Please fill in all the required fields.", variant: "destructive" });
            return;
        }
        if (!mapInstanceRef.current) {
            toast({ title: "Map Error", description: "The map is not initialized. Please try again.", variant: "destructive" });
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
                body: JSON.stringify({ lat, lng }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get address.');
            }
            
            const existingAddresses = await getAddresses(user.uid);

            const addressToSave: Omit<Address, 'id'> = {
                fullName,
                type: 'Home', // Defaulting to Home, can be changed later
                street, // This is now the house/building number
                village: data.village || '',
                city: data.city || '',
                pinCode: data.pinCode || '',
                phone,
                alternatePhone: '',
                isDefault: existingAddresses.length === 0,
                lat: lat,
                lng: lng,
            };

            await addAddress(user.uid, addressToSave);

            toast({ title: "Address Saved!", description: "The new address has been added to your profile." });
            onSaveSuccess();
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
                    <DialogTitle>Add a New Address</DialogTitle>
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
                        {!apiUrl && !isLoading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                                <p className="text-destructive font-semibold">Map is not configured.</p>
                            </div>
                        )}
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <MapPin className="h-10 w-10 text-primary drop-shadow-lg" style={{ transform: 'translateY(-50%)' }} />
                        </div>
                        <div ref={mapRef} style={containerStyle} />
                    </div>
                    <div className="space-y-3">
                        <Label>Confirm Your Details</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" />
                        </div>
                        <div className="relative">
                           <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="House No. / Building Name / Street" value={street} onChange={(e) => setStreet(e.target.value)} className="pl-9" />
                        </div>
                        <div className="relative">
                           <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <Input type="tel" placeholder="10-digit Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveAddress} disabled={isLoading || isProcessing || !apiUrl}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Saving...' : 'Save Address'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
