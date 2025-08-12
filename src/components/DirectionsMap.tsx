
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Route, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const RESTAURANT_COORDS = { lat: 25.970963, lng: 83.873754 };
const MAP_SCRIPT_ID = "gomaps-pro-api-script";

// This function now ALWAYS assumes the input is a key and builds the URL.
const buildScriptUrl = (apiKey: string): string => {
    if (!apiKey) return "";
    if (apiKey.startsWith('http')) {
        return apiKey;
    }
    return `https://maps.gomaps.pro/maps/api/js?key=${apiKey}&libraries=places`;
};

const loadScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Always remove the old script tag if it exists, to ensure a fresh load
      const existingScript = document.getElementById(id);
      if (existingScript) {
        existingScript.remove();
      }

      // Check if google maps is already available (e.g., from a previous successful load)
      if (window.google && window.google.maps) {
        return resolve();
      }
  
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load map script. The API key may be invalid or the URL incorrect.`));
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


export default function DirectionsMap({ destinationAddress, destinationCoords, riderCoords, view = 'default', apiUrl }: DirectionsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<google.maps.Map | null>(null);
    const riderMarker = useRef<google.maps.Marker | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [distance, setDistance] = useState<string | null>(null);
    const { toast } = useToast();

    const initMap = useCallback(() => {
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
            mapTypeId: view === 'satellite' ? 'satellite' : 'roadmap',
        });
        mapInstance.current = map;

        const destinationLatLng = destinationCoords 
            ? new window.google.maps.LatLng(destinationCoords.lat, destinationCoords.lng)
            : null;
        
        if (!destinationLatLng) {
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

        const distKm = getDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, destinationLatLng.lat(), destinationLatLng.lng());
        setDistance(`${distKm.toFixed(2)} km`);
        setIsLoading(false);

    }, [destinationCoords, view]);
    
    useEffect(() => {
      let isMounted = true;
      
      if (!apiUrl) {
        setError("Map API Key is not configured in settings.");
        setIsLoading(false);
        return;
      }
  
      setIsLoading(true);
      setError(null);
  
      const fullApiUrl = buildScriptUrl(apiUrl);
      loadScript(fullApiUrl, MAP_SCRIPT_ID)
        .then(() => {
          if (isMounted) {
            initMap();
          }
        })
        .catch((err: Error) => {
          console.error(err);
          if (isMounted) {
            setError(err.message);
            toast({
              title: "Map Error",
              description: err.message,
              variant: "destructive",
            });
            setIsLoading(false);
          }
        });
  
      return () => { isMounted = false; };
    }, [initMap, toast, apiUrl]);

    useEffect(() => {
        if (!mapInstance.current || !window.google?.maps) return;

        const bikeIcon = {
            path: 'M14.5,9.5c0,-1.1 -0.9,-2 -2,-2s-2,0.9 -2,2s0.9,2 2,2s2,-0.9 2,-2zm-8,0c0,-1.1 -0.9,-2 -2,-2s-2,0.9 -2,2s0.9,2 2,2s2,-0.9 2,-2zm5.5,5.5l-2,0l-3,-3l-2,0l0,3l-2,0l0,-5l5,-2.5l0.5,0l3,2.5l0,5zm-3.5,-1c-0.8,0 -1.5,0.7 -1.5,1.5c0,0.8 0.7,1.5 1.5,1.5s1.5,-0.7 1.5,-1.5c0,-0.8 -0.7,-1.5 -1.5,-1.5zm-5,0c-0.8,0 -1.5,0.7 -1.5,1.5c0,0.8 0.7,1.5 1.5,1.5s1.5,-0.7 1.5,-1.5c0,-0.8 -0.7,-1.5 -1.5,-1.5z',
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            rotation: 0,
            scale: 1.5,
            anchor: new window.google.maps.Point(10, 10),
        };

        if (riderCoords) {
            const position = new window.google.maps.LatLng(riderCoords.lat, riderCoords.lng);
            if (riderMarker.current) {
                riderMarker.current.setPosition(position);
            } else {
                riderMarker.current = new window.google.maps.Marker({
                    position,
                    map: mapInstance.current,
                    icon: bikeIcon,
                    title: "Rider Location"
                });
            }
             mapInstance.current.panTo(position);
        } else {
            if (riderMarker.current) {
                riderMarker.current.setMap(null);
                riderMarker.current = null;
            }
        }
    }, [riderCoords]);


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
                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center bg-destructive/10 backdrop-blur-sm rounded-lg p-4">
                    <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                    <p className="text-destructive font-semibold">{error}</p>
                    <p className="text-destructive/80 text-sm mt-1">Please check the API Key in the admin settings.</p>
                     <Button variant="destructive" size="sm" asChild className="mt-4">
                        <Link href="/admin/payment">Go to Settings</Link>
                    </Button>
                </div>
            )}
            <div ref={mapRef} style={containerStyle} />
        </div>
    );
}
