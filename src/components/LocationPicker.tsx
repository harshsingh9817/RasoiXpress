
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

const MAP_SCRIPT_ID = "gomaps-pro-script";

interface LocationPickerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onLocationSelect: (address: { street: string; village: string; city: string; pinCode: string; }) => void;
    apiUrl: string | undefined;
}

export default function LocationPicker({ isOpen, onOpenChange, onLocationSelect, apiUrl }: LocationPickerProps) {
    const { toast } = useToast();
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [markerInstance, setMarkerInstance] = useState<google.maps.Marker | null>(null);
    const [markerPosition, setMarkerPosition] = useState(center);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScriptReady, setIsScriptReady] = useState(false);
    const [isLoadingMap, setIsLoadingMap] = useState(true);
    
    // Effect to reset state when dialog closes to allow reopening
    useEffect(() => {
        if (!isOpen) {
            setMapInstance(null);
            setMarkerInstance(null);
            setIsLoadingMap(true); // Reset loading state for next open
            setIsScriptReady(false); // Reset script readiness
        }
    }, [isOpen]);
    
    // Effect to load the GoMaps script
    useEffect(() => {
        if (!isOpen || !apiUrl) return;

        const setReady = () => setIsScriptReady(true);
        
        // If script is already on page and google object exists, just set ready
        if (document.getElementById(MAP_SCRIPT_ID) && (window as any).google?.maps) {
            setReady();
            return;
        }

        // Define the callback function on the window object
        (window as any).initMap = setReady;

        // Create and append the script tag if it doesn't exist
        const existingScript = document.getElementById(MAP_SCRIPT_ID);
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = apiUrl;
            script.id = MAP_SCRIPT_ID;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        // Cleanup function to remove callback from window
        return () => {
            if ((window as any).initMap === setReady) {
                delete (window as any).initMap;
            }
        };
    }, [isOpen, apiUrl]);

    // Initialize map
    useEffect(() => {
        if (isOpen && isScriptReady && mapRef.current && !mapInstance) {
            setIsLoadingMap(false); // Map instance is created, hide loader
            const map = new window.google.maps.Map(mapRef.current, {
                center,
                zoom: 14,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            });
            setMapInstance(map);

            map.addListener('click', (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                }
            });
        }
    }, [isScriptReady, mapInstance, isOpen]);

    // Update marker
    useEffect(() => {
        if (mapInstance) {
            if (!markerInstance) {
                const marker = new window.google.maps.Marker({
                    position: markerPosition,
                    map: mapInstance,
                    draggable: true,
                });
                marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
                     if (e.latLng) {
                        setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                    }
                });
                setMarkerInstance(marker);
            } else {
                markerInstance.setPosition(markerPosition);
            }
        }
    }, [mapInstance, markerInstance, markerPosition]);

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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Pick Your Location</DialogTitle>
                    <DialogDescription>
                        Click on the map or drag the pin to set your delivery location.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 relative h-[400px]">
                     {(isLoadingMap || !isScriptReady) && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                            <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                            <p className="text-muted-foreground mt-4">Loading Map...</p>
                        </div>
                    )}
                    <div ref={mapRef} style={containerStyle} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmLocation} disabled={isLoadingMap || isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : 'Confirm Location'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
