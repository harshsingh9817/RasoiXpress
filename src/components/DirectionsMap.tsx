
"use client";

import React, { useState, useEffect, useRef } from 'react';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

// Hanuman Mandir Ghosi More Nagra coordinates
const RESTAURANT_LOCATION = 'Hanuman Mandir, Ghosi More, Nagra, Ballia, Uttar Pradesh 221711';
const MAP_SCRIPT_ID = "gomaps-pro-script";

interface DirectionsMapProps {
    destinationAddress: string;
    apiUrl: string | undefined;
}

export default function DirectionsMap({ destinationAddress, apiUrl }: DirectionsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isScriptReady, setIsScriptReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Effect to load the GoMaps script
    useEffect(() => {
        if (!apiUrl) {
            setError("Map API URL is not configured.");
            setIsLoading(false);
            return;
        }

        const setReady = () => setIsScriptReady(true);

        if ((window as any).google && (window as any).google.maps) {
            setReady();
            return;
        }
        
        (window as any).initMap = setReady;

        const existingScript = document.getElementById(MAP_SCRIPT_ID);
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = apiUrl;
            script.id = MAP_SCRIPT_ID;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        } else {
             if (!(window as any).google || !(window as any).google.maps) {
                // The script is there but hasn't finished loading, the callback will handle it.
            } else {
                setReady();
            }
        }

        return () => {
            if ((window as any).initMap === setReady) {
                delete (window as any).initMap;
            }
        };
    }, [apiUrl]);

    useEffect(() => {
        if (isScriptReady && mapRef.current) {
            setIsLoading(true);
            setError(null);
            
            const map = new window.google.maps.Map(mapRef.current, {
                zoom: 12,
                center: { lat: 26.1555, lng: 83.7919 }, // Default center
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            });

            const directionsService = new window.google.maps.DirectionsService();
            const directionsRenderer = new window.google.maps.DirectionsRenderer();
            
            directionsRenderer.setMap(map);

            directionsService.route(
                {
                    origin: RESTAURANT_LOCATION,
                    destination: destinationAddress,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK && result) {
                        directionsRenderer.setDirections(result);
                    } else {
                        console.error(`Error fetching directions: ${status}`);
                        setError(`Could not load directions. The address might be invalid or unreachable.`);
                    }
                    setIsLoading(false);
                }
            );
        }
    }, [isScriptReady, destinationAddress]);


    return (
        <div className="relative h-[400px]">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                    <p className="text-muted-foreground mt-4">Loading Map & Directions...</p>
                </div>
            )}
            {error && !isLoading && (
                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-background/80 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-destructive font-semibold">{error}</p>
                </div>
            )}
            <div ref={mapRef} style={containerStyle} />
        </div>
    );
}
