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
const GOMAPS_API_KEY = "AlzaSyGRY90wWGv1cIycdXYYuKjwkEWGq80P-Nc";
const MAP_SCRIPT_ID = "gomaps-pro-script";

interface DirectionsMapProps {
    destinationAddress: string;
}


export default function DirectionsMap({ destinationAddress }: DirectionsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [directionsStatus, setDirectionsStatus] = useState<google.maps.DirectionsStatus | 'IDLE'>('IDLE');
    const [isScriptReady, setIsScriptReady] = useState(false);
    
    // Effect to load the GoMaps script
    useEffect(() => {
        const setReady = () => setIsScriptReady(true);

        if ((window as any).google && (window as any).google.maps) {
            setReady();
            return;
        }
        
        (window as any).initMap = setReady;

        const existingScript = document.getElementById(MAP_SCRIPT_ID);
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = `https://maps.gomaps.pro/maps/api/js?key=${GOMAPS_API_KEY}&libraries=places&callback=initMap`;
            script.id = MAP_SCRIPT_ID;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        return () => {
            if ((window as any).initMap === setReady) {
                delete (window as any).initMap;
            }
        };
    }, []);

    useEffect(() => {
        if (isScriptReady && mapRef.current && !mapInstance) {
             const map = new window.google.maps.Map(mapRef.current, {
                zoom: 12,
                center: { lat: 26.1555, lng: 83.7919 }, // Default center
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            });
            setMapInstance(map);
        }
    }, [isScriptReady, mapInstance]);

    useEffect(() => {
        if (mapInstance && destinationAddress && directionsStatus === 'IDLE') {
            const directionsService = new window.google.maps.DirectionsService();
            const directionsRenderer = new window.google.maps.DirectionsRenderer();
            
            directionsRenderer.setMap(mapInstance);

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
                    }
                    setDirectionsStatus(status);
                }
            );
        }
    }, [mapInstance, destinationAddress, directionsStatus]);


    if (!isScriptReady) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] bg-muted rounded-lg">
                <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                <p className="text-muted-foreground mt-4">Loading Map...</p>
            </div>
        );
    }
    
    if (directionsStatus !== 'IDLE' && directionsStatus !== 'OK') {
        return (
             <div className="flex flex-col items-center justify-center h-[400px] bg-muted rounded-lg">
                <p className="text-destructive">Could not load directions.</p>
                <p className="text-xs text-muted-foreground">The address might be invalid or unreachable.</p>
            </div>
        );
    }
    
    return <div ref={mapRef} style={containerStyle} />;
}
