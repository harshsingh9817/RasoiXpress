

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Route } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const RESTAURANT_COORDS = { lat: 25.970963, lng: 83.873754 };
const MAP_SCRIPT_ID = "gomaps-pro-api-script";

interface DirectionsMapProps {
    destinationAddress: string;
    destinationCoords?: { lat: number; lng: number };
    apiUrl: string | undefined;
    useLiveLocationForOrigin?: boolean;
}

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let script = document.getElementById(id) as HTMLScriptElement;
      if (script) {
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
  
      script = document.createElement('script');
      const url = new URL(src);
      url.searchParams.delete('callback');
      script.src = url.toString();
      script.id = id;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};


export default function DirectionsMap({ destinationAddress, destinationCoords, apiUrl, useLiveLocationForOrigin = false }: DirectionsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [distance, setDistance] = useState<string | null>(null);
    const { toast } = useToast();

    const initMap = useCallback(async () => {
        if (!mapRef.current || !window.google?.maps) return;

        setIsLoading(true);
        setError(null);
        setDistance(null);
        
        const map = new window.google.maps.Map(mapRef.current, {
            zoom: 12,
            center: RESTAURANT_COORDS,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
        });

        try {
            const destinationLatLng = destinationCoords 
                ? new window.google.maps.LatLng(destinationCoords.lat, destinationCoords.lng)
                : null;
            
            if (!destinationLatLng) {
                // If we don't have coords, we'd need a geocoding call, which we want to avoid.
                // For now, we'll just show the restaurant marker.
                new window.google.maps.Marker({
                    position: RESTAURANT_COORDS,
                    map: map,
                    title: 'Restaurant Location'
                });
                setIsLoading(false);
                return;
            }

            const bounds = new window.google.maps.LatLngBounds();

            new window.google.maps.Marker({
                position: RESTAURANT_COORDS,
                map: map,
                title: 'Origin (Restaurant)'
            });
            bounds.extend(RESTAURANT_COORDS);

            new window.google.maps.Marker({
                position: destinationLatLng,
                map: map,
                title: 'Destination'
            });
            bounds.extend(destinationLatLng);

            map.fitBounds(bounds);

            // Calculate distance locally
            const distKm = getDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, destinationLatLng.lat(), destinationLatLng.lng());
            setDistance(`${distKm.toFixed(2)} km`);

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while setting up the map.');
        } finally {
            setIsLoading(false);
        }

    }, [destinationCoords, destinationAddress]);
    
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
            if (isMounted) {
              initMap();
            }
          })
          .catch((err) => {
            console.error(err);
            if (isMounted) {
              setError("Could not load map script.");
              toast({
                title: "Error",
                description: "Could not load the map.",
                variant: "destructive",
              });
              setIsLoading(false);
            }
          });
    
        return () => {
          isMounted = false;
        };
      }, [apiUrl, initMap, toast]);


    return (
        <div className="relative h-[400px]">
            {distance && (
                <Badge variant="secondary" className="absolute top-2 left-2 z-10 text-base shadow-lg bg-background/80 backdrop-blur-sm">
                    <Route className="mr-2 h-4 w-4" />
                    Distance: {distance}
                </Badge>
            )}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                    <p className="text-muted-foreground mt-4">Loading Map...</p>
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
