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
    const markerRef = useRef<google.maps.Marker | null>(null);
    const [currentPosition, setCurrentPosition] = useState(center);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google?.maps) return;

        setIsLoading(false); // Hide spinner, show map container

        const map = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 14,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
        });

        markerRef.current = new window.google.maps.Marker({
            position: center,
            map: map,
            draggable: true,
        });

        const handlePositionChange = () => {
            if (markerRef.current) {
                const pos = markerRef.current.getPosition();
                if (pos) {
                    setCurrentPosition({ lat: pos.lat(), lng: pos.lng() });
                }
            }
        };

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng && markerRef.current) {
                markerRef.current.setPosition(e.latLng);
                handlePositionChange();
            }
        });

        markerRef.current.addListener('dragend', handlePositionChange);

    }, []);

    useEffect(() => {
        if (!isOpen) return;

        if (!apiUrl) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);

        if (window.google?.maps) {
            initMap();
            return;
        }

        window.initMap = initMap;
        
        const existingScript = document.getElementById(MAP_SCRIPT_ID);
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = apiUrl;
            script.id = MAP_SCRIPT_ID;
            script.async = true;
            script.defer = true;
            script.onerror = () => {
                toast({ title: "Error", description: "Could not load map script.", variant: "destructive" });
                setIsLoading(false);
            };
            document.body.appendChild(script);
        } else if (!window.google?.maps) {
            // Script tag exists but window.google.maps is not there yet. The callback will handle it.
        }
        
    }, [isOpen, apiUrl, initMap, toast]);

    const handleConfirmLocation = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: currentPosition.lat, lng: currentPosition.lng }),
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
                     {isLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                            <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                            <p className="text-muted-foreground mt-4">Loading Map...</p>
                        </div>
                    )}
                    {!apiUrl && !isLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                            <p className="text-destructive font-semibold">Map is not configured.</p>
                        </div>
                    )}
                    <div ref={mapRef} style={containerStyle} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmLocation} disabled={isLoading || isProcessing || !apiUrl}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : 'Confirm Location'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}