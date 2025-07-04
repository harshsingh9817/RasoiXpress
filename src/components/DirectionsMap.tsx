
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
const RESTAURANT_LOCATION_STRING = `${RESTAURANT_COORDS.lat},${RESTAURANT_COORDS.lng}`;
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

// Polyline decoder from the user's example
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
    if (!encoded) {
      return [];
    }
    let points: { lat: number; lng: number }[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
  
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
  
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
  
      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
  
    return points;
}


export default function DirectionsMap({ destinationAddress, destinationCoords, apiUrl, useLiveLocationForOrigin = false }: DirectionsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [distance, setDistance] = useState<string | null>(null);
    const { toast } = useToast();

    const initMap = useCallback(async () => {
        if (!mapRef.current || !window.google?.maps || !apiUrl) return;

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

        const getOrigin = (): Promise<string> => {
            return new Promise((resolve, reject) => {
                if (useLiveLocationForOrigin) {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                resolve(`${position.coords.latitude},${position.coords.longitude}`);
                            },
                            () => {
                                toast({ title: "Location Error", description: "Could not get your location. Defaulting to restaurant.", variant: "destructive"});
                                resolve(RESTAURANT_LOCATION_STRING);
                            }
                        );
                    } else {
                        reject("Your browser doesn't support geolocation.");
                    }
                } else {
                    resolve(RESTAURANT_LOCATION_STRING);
                }
            });
        };

        try {
            const origin = await getOrigin();
            const destination = destinationCoords 
                ? `${destinationCoords.lat},${destinationCoords.lng}` 
                : destinationAddress;

            const urlParams = new URL(apiUrl).searchParams;
            const apiKey = urlParams.get('key');
            
            if (!apiKey) {
                throw new Error("API key not found in the provided map URL.");
            }

            const directionsUrl = `https://maps.gomaps.pro/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;

            const response = await fetch(directionsUrl);
            const data = await response.json();

            if (data.status === 'OK' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const leg = route.legs[0];

                if (leg.distance?.text) {
                    setDistance(leg.distance.text);
                }

                const decodedPath = decodePolyline(route.overview_polyline.points);

                if (decodedPath.length > 0) {
                    const bounds = new window.google.maps.LatLngBounds();

                    new window.google.maps.Marker({
                        position: decodedPath[0],
                        map: map,
                        title: 'Origin'
                    });
                    bounds.extend(decodedPath[0]);

                    new window.google.maps.Marker({
                        position: decodedPath[decodedPath.length - 1],
                        map: map,
                        title: 'Destination'
                    });
                    bounds.extend(decodedPath[decodedPath.length - 1]);
                    
                    const routePolyline = new window.google.maps.Polyline({
                        path: decodedPath,
                        geodesic: true,
                        strokeColor: '#E64A19',
                        strokeOpacity: 0.8,
                        strokeWeight: 5,
                    });

                    routePolyline.setMap(map);
                    map.fitBounds(bounds);
                } else {
                     throw new Error("Could not decode the route polyline.");
                }

            } else {
                console.error("Error fetching directions:", data.error_message || data.status);
                throw new Error(data.error_message || `Could not get directions: ${data.status}`);
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while fetching directions.');
        } finally {
            setIsLoading(false);
        }

    }, [destinationAddress, destinationCoords, useLiveLocationForOrigin, toast, apiUrl]);
    
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
