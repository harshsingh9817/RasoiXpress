
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
import { MapPin, LocateFixed, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
        script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0&callback=initMap`;
        script.async = true;
        script.defer = true;
        (window as any).initMap = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Mappls map script. The API key may be invalid.'));
        document.head.appendChild(script);
    });
};

export default function LocationPicker({ isOpen, onOpenChange, onSaveSuccess }: LocationPickerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addressDetails, setAddressDetails] = useState<Partial<Address>>({
    fullName: user?.displayName || '',
    phone: '',
    type: 'Home'
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setApiKey(process.env.NEXT_PUBLIC_MAPPLS_API_KEY || null);
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
        toast({ title: 'Geolocation is not supported by your browser.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setCoords({ lat: latitude, lng: longitude });
            try {
                const response = await fetch('/api/reverse-geocode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat: latitude, lng: longitude, apiKey }),
                });
                if (!response.ok) throw new Error('Failed to fetch address');
                const data = await response.json();
                setAddressDetails(prev => ({
                    ...prev,
                    street: data.street,
                    village: data.village,
                    city: data.city,
                    state: data.state,
                    pinCode: data.pinCode,
                }));
            } catch (err) {
                toast({ title: 'Could not fetch address details.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        },
        () => {
            toast({ title: 'Unable to retrieve your location.', description: 'Please enable location services.', variant: 'destructive' });
            setIsLoading(false);
        }
    );
  };
  
  const handleSave = async () => {
    if (!user || !coords) return;
    if (!addressDetails.fullName || !addressDetails.phone) {
        toast({ title: "Missing Information", description: "Please enter your full name and phone number.", variant: "destructive" });
        return;
    }
    if (!/^\d{10}$/.test(addressDetails.phone)) {
        toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
        return;
    }
     if (!addressDetails.pinCode || !/^\d{6}$/.test(addressDetails.pinCode)) {
        toast({ title: "Invalid PIN Code", description: "Please enter a valid 6-digit PIN code.", variant: "destructive" });
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
        pinCode: addressDetails.pinCode,
        isDefault: false, // This will be handled by logic on the checkout page
        lat: coords.lat,
        lng: coords.lng,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
          <DialogDescription>
            Use GPS to fill your address automatically or enter it manually.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
             <Alert>
                <LocateFixed className="h-4 w-4" />
                <AlertTitle>Location Services</AlertTitle>
                <AlertDescription>
                    Click the button below to automatically fill in your address using your device's GPS.
                </AlertDescription>
                <Button onClick={handleGetCurrentLocation} disabled={isLoading || !apiKey} className="mt-4 w-full">
                    {isLoading ? <AnimatedPlateSpinner className="h-5 w-5 mr-2" /> : <MapPin className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Fetching...' : 'Get Current Location'}
                </Button>
                {!apiKey && <p className="text-xs text-destructive mt-2 text-center">Location service is not configured.</p>}
             </Alert>
             
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Full Name*</Label><Input value={addressDetails.fullName} onChange={e => setAddressDetails(p => ({ ...p, fullName: e.target.value }))} /></div>
                <div><Label>Phone*</Label><Input type="tel" value={addressDetails.phone} onChange={e => setAddressDetails(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>House, Street*</Label><Input value={addressDetails.street} onChange={e => setAddressDetails(p => ({ ...p, street: e.target.value }))} /></div>
                <div><Label>Village/Area</Label><Input value={addressDetails.village} onChange={e => setAddressDetails(p => ({ ...p, village: e.target.value }))} /></div>
                <div><Label>City*</Label><Input value={addressDetails.city} onChange={e => setAddressDetails(p => ({ ...p, city: e.target.value }))} /></div>
                <div><Label>PIN Code*</Label><Input value={addressDetails.pinCode} onChange={e => setAddressDetails(p => ({ ...p, pinCode: e.target.value }))} /></div>
                <div><Label>State*</Label><Input value={addressDetails.state} onChange={e => setAddressDetails(p => ({ ...p, state: e.target.value }))} /></div>
                 <div><Label>Address Type</Label>
                    <select value={addressDetails.type} onChange={e => setAddressDetails(p => ({...p, type: e.target.value as 'Home' | 'Work' | 'Other'}))} className="w-full h-10 border border-input bg-background rounded-md px-3 text-sm">
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!coords || isSaving}>
            {isSaving ? <AnimatedPlateSpinner className="h-5 w-5 mr-2" /> : <MapPin className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Address'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
