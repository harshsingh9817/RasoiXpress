
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addAddress } from '@/lib/data';
import type { Address } from '@/lib/types';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    mappls: any;
  }
}

interface LocationPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: (newAddressId: string) => void;
  apiKey?: string | null;
}

const MAP_SCRIPT_ID = "mappls-sdk-script";

const loadScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.getElementById(MAP_SCRIPT_ID)) {
            if (window.mappls) return resolve();
            
            const existingScript = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement;
            const onScriptLoad = () => {
                if (window.mappls) resolve();
                else reject(new Error('Mappls SDK failed to initialize.'));
                existingScript.removeEventListener('load', onScriptLoad);
            };
            existingScript.addEventListener('load', onScriptLoad);
            return;
        }
  
        const script = document.createElement('script');
        script.id = MAP_SCRIPT_ID;
        script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Mappls map script. The API key may be invalid.'));
        document.head.appendChild(script);
    });
};


export default function LocationPicker({ isOpen, onOpenChange, onSaveSuccess, apiKey: apiKeyProp }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const marker = useRef<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addressDetails, setAddressDetails] = useState<Partial<Address>>({
    fullName: user?.displayName || '',
    phone: '',
    type: 'Home'
  });
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.mappls) return;
    setIsLoading(true);
    setError(null);
    
    mapInstance.current = new window.mappls.Map(mapRef.current, {
        center: { lat: 25.970963, lng: 83.873754 }, // Nagra, Ballia
        zoom: 15,
    });
    
    setIsLoading(false);

    mapInstance.current.addListener('click', (e: any) => {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setSelectedCoords(coords);
        if (marker.current) {
            marker.current.setPosition(coords);
        } else {
            marker.current = new window.mappls.Marker({ map: mapInstance.current, position: coords });
        }
        mapInstance.current.panTo(coords);
        
        // Reverse Geocode
        fetch(`https://apis.mappls.com/advancedmaps/v1/${process.env.NEXT_PUBLIC_MAPPLS_API_KEY}/rev_geocode?lat=${coords.lat}&lng=${coords.lng}`)
            .then(res => res.json())
            .then(data => {
                if(data.results && data.results.length > 0) {
                    const result = data.results[0];
                    setAddressDetails(prev => ({
                        ...prev,
                        street: `${result.houseName || ''} ${result.houseNumber || ''}, ${result.street || ''}`.trim().replace(/^,/, '').trim(),
                        village: result.subLocality || result.locality,
                        city: result.city || result.district,
                        state: result.state,
                        pinCode: result.pincode,
                    }));
                }
            })
            .catch(err => {
                console.error("Reverse geocoding failed", err);
                toast({ title: 'Could not fetch address details.', variant: 'destructive' });
            });
    });

  }, []);

  useEffect(() => {
    if (isOpen) {
        setAddressDetails({ fullName: user?.displayName || '', phone: '', type: 'Home' });
        setSelectedCoords(null);

        const apiKey = process.env.NEXT_PUBLIC_MAPPLS_API_KEY;
        if (!apiKey) {
            setError("Mappls API key is not configured.");
            setIsLoading(false);
            return;
        }
        
        loadScript(apiKey).then(initMap).catch(err => {
            setError(err.message);
            setIsLoading(false);
        });
    }
  }, [isOpen, user, initMap]);


  const handleSave = async () => {
    if (!user || !selectedCoords) return;
    if (!addressDetails.fullName || !addressDetails.phone) {
        toast({ title: "Missing Information", description: "Please enter your full name and phone number.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const newAddress: Omit<Address, 'id'> = {
        fullName: addressDetails.fullName,
        phone: addressDetails.phone,
        type: addressDetails.type || 'Home',
        street: addressDetails.street || 'N/A',
        village: addressDetails.village || '',
        city: addressDetails.city || 'N/A',
        state: addressDetails.state || 'N/A',
        pinCode: addressDetails.pinCode || 'N/A',
        isDefault: false, // This will be handled by logic on the checkout page
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
    };
    
    try {
        const addedAddress = await addAddress(user.uid, newAddress);
        toast({ title: "Address Saved!", description: "New address has been added to your profile." });
        onSaveSuccess(addedAddress.id);
        onOpenChange(false);
    } catch (err: any) {
        toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Select Delivery Location</DialogTitle>
          <DialogDescription>
            Click on the map to set your address. Fine-tune the details in the form below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow relative">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                    <AnimatedPlateSpinner className="h-16 w-16" />
                </div>
            )}
            {error && (
                 <div className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/10 text-destructive text-center p-4">
                     {error}
                 </div>
            )}
            <div ref={mapRef} className="h-full w-full" />
        </div>

        <div className="p-6 overflow-y-auto bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input value={addressDetails.fullName} onChange={e => setAddressDetails(p => ({ ...p, fullName: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={addressDetails.phone} onChange={e => setAddressDetails(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>House, Street</Label><Input value={addressDetails.street} onChange={e => setAddressDetails(p => ({ ...p, street: e.target.value }))} /></div>
                <div><Label>Village/Area</Label><Input value={addressDetails.village} onChange={e => setAddressDetails(p => ({ ...p, village: e.target.value }))} /></div>
                <div><Label>City</Label><Input value={addressDetails.city} disabled /></div>
                <div><Label>PIN Code</Label><Input value={addressDetails.pinCode} disabled /></div>
            </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedCoords || isSaving}>
            {isSaving ? <AnimatedPlateSpinner className="h-5 w-5 mr-2" /> : <MapPin className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Address'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

