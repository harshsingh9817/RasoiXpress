"use client";

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { Loader2, MapPin } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

// Hanuman Mandir Ghosi More Nagra coordinates
const center = {
  lat: 26.1555,
  lng: 83.7919
};

interface LocationPickerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onLocationSelect: (address: { street: string; village: string; city: string; pinCode: string; }) => void;
}

export default function LocationPicker({ isOpen, onOpenChange, onLocationSelect }: LocationPickerProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['places'],
    });

    const [markerPosition, setMarkerPosition] = useState(center);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            setMarkerPosition({
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            });
        }
    }, []);

    const handleMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            setMarkerPosition({
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            });
        }
    }, []);

    const handleConfirmLocation = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: markerPosition.lat, lng: markerPosition.lng }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get address.');
            }
            
            onLocationSelect({
                street: data.street || '',
                village: data.village || '',
                city: data.city || '',
                pinCode: data.pinCode || '',
            });

            toast({ title: "Location Set!", description: "Address fields have been updated." });
            onOpenChange(false);

        } catch (error: any) {
            console.error("Reverse geocoding error:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const renderMap = () => {
        if (loadError) {
            return <div>Error loading maps. Please check your API key and network connection.</div>;
        }

        if (!isLoaded) {
            return (
                <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                    <p className="text-muted-foreground mt-4">Loading Map...</p>
                </div>
            );
        }

        return (
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                onClick={handleMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                }}
            >
                <Marker
                    position={markerPosition}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                />
            </GoogleMap>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Pick Your Location</DialogTitle>
                    <DialogDescription>
                        Click on the map or drag the pin to set your delivery location.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {renderMap()}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmLocation} disabled={!isLoaded || isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : 'Confirm Location'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
