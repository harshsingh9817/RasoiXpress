
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Route, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

declare global {
  interface Window {
    mappls: any;
  }
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const RESTAURANT_COORDS = { lat: 25.970951, lng: 83.873747 };
const MAP_SCRIPT_ID = "mappls-sdk-script";

const loadScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(MAP_SCRIPT_ID)) {
        if (window.mappls) {
            return resolve();
        }
        setTimeout(() => {
            if(window.mappls) resolve();
            else reject(new Error('Mappls SDK failed to initialize.'));
        }, 1000);
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


interface DirectionsMapProps {
    destinationAddress?: string;
    destinationCoords?: { lat: number; lng: number };
    riderCoords?: { lat: number; lng: number } | null;
    view?: 'default' | 'satellite';
    apiUrl?: string | null;
}


export default function DirectionsMap({ destinationAddress, destinationCoords, riderCoords, view = 'default', apiUrl }: DirectionsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any | null>(null);
    const riderMarker = useRef<any | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [distance, setDistance] = useState<string | null>(null);
    const { toast } = useToast();

    const apiKey = React.useMemo(() => {
        if (apiUrl) {
          try {
            const url = new URL(apiUrl);
            return url.pathname.split('/')[3] || null;
          } catch {
            return null;
          }
        }
        return null;
      }, [apiUrl]);

    const initMap = useCallback(() => {
        if (!mapRef.current || !window.mappls) return;

        setIsLoading(true);
        setError(null);
        setDistance(null);
        
        mapInstance.current = new window.mappls.Map(mapRef.current, {
            center: { lat: RESTAURANT_COORDS.lat, lng: RESTAURANT_COORDS.lng },
            zoom: 12,
        });

        if (!destinationCoords) {
            new window.mappls.Marker({ map: mapInstance.current, position: RESTAURANT_COORDS });
            setIsLoading(false);
            return;
        }

        const markers = [
            {
                position: RESTAURANT_COORDS,
                title: 'Restaurant',
            },
            {
                position: destinationCoords,
                title: 'Destination',
            }
        ];
        mapInstance.current.fitBounds(markers.map(m => m.position), { padding: 50 });
        
        new window.mappls.Marker({ map: mapInstance.current, position: RESTAURANT_COORDS });
        new window.mappls.Marker({ map: mapInstance.current, position: destinationCoords });

        const distKm = getDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, destinationCoords.lat, destinationCoords.lng);
        setDistance(`${distKm.toFixed(2)} km`);
        setIsLoading(false);

    }, [destinationCoords, view]);
    
    useEffect(() => {
      let isMounted = true;
      
      if (!apiKey) {
        setError("Mappls API Key is not configured.");
        setIsLoading(false);
        return;
      }
  
      setIsLoading(true);
      setError(null);
  
      loadScript(apiKey)
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
    }, [initMap, toast, apiKey]);

    useEffect(() => {
        if (!mapInstance.current || !window.mappls) return;

        const bikeIcon = {
            url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWJpa2UiPjxjaXJjbGUgY3g9IjUuNSIgY3k9IjE3LjUiIHI9IjMuNSIvPjxjaXJjbGUgY3g9IjE4LjUiIGN5PSIxNy41IiByPSIzLjUiLz48cGF0aCBkPSJNMTIgM2wtMi41IDcgLTMtMy0yIDQiLz48cGF0aCBkPSJNMTYgM2gtMi41bC0yIDdscTMtMy41IDctMS41Ii8+PC9zdmc+',
            width: 32,
            height: 32
        };

        if (riderCoords) {
            const position = { lat: riderCoords.lat, lng: riderCoords.lng };
            if (riderMarker.current) {
                riderMarker.current.setPosition(position);
            } else {
                riderMarker.current = new window.mappls.Marker({
                    map: mapInstance.current,
                    position: position,
                    icon_html: `<div style="color:hsl(var(--primary));"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M12 3-2.5 7-3-3-2 4"/><path d="m16 3-2.5 7q3-3.5 7-1.5"/></svg></div>`
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
                    <p className="text-destructive/80 text-sm mt-1">Please check your Mappls API Key in the settings.</p>
                </div>
            )}
            <div ref={mapRef} style={containerStyle} />
        </div>
    );
}
