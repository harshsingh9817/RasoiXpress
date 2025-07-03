
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { useToast } from '@/hooks/use-toast';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const RESTAURANT_LOCATION = 'Hanuman Mandir, Ghosi More, Nagra, Ballia, Uttar Pradesh 221711';
const MAP_SCRIPT_ID = "gomaps-pro-api-script";

interface DirectionsMapProps {
    destinationAddress: string;
    apiUrl: string | undefined;
}

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById(id);
      if (existingScript) {
        // If script tag exists, check if google.maps is already available
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            resolve();
          } else {
            // It's possible the script is still loading, wait and check again
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

export default function DirectionsMap({ destinationAddress, apiUrl }: DirectionsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google?.maps) return;

        setIsLoading(false);
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
            }
        );
    }, [destinationAddress]);
    
    useEffect(() => {
        let isMounted = true;

        if (!apiUrl) {
            setError("Map API URL is not configured.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        loadScript(apiUrl, MAP_SCRIPT_ID)
            .then(() => {
                if (isMounted) initMap();
            })
            .catch(err => {
                console.error(err);
                if (isMounted) {
                    setError("Could not load map script.");
                    toast({ title: "Error", description: "Could not load the map.", variant: "destructive" });
                    setIsLoading(false);
                }
            });

        return () => { isMounted = false; }

    }, [apiUrl, initMap, toast]);


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
