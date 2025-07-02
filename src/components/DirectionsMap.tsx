"use client";

import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

// Hanuman Mandir Ghosi More Nagra coordinates
const RESTAURANT_LOCATION = 'Hanuman Mandir, Ghosi More, Nagra, Ballia, Uttar Pradesh 221711';

interface DirectionsMapProps {
    destinationAddress: string;
}

export default function DirectionsMap({ destinationAddress }: DirectionsMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ['places'],
    });

    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [status, setStatus] = useState<google.maps.DirectionsStatus | null>(null);

    useEffect(() => {
        if (isLoaded && destinationAddress) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: RESTAURANT_LOCATION,
                    destination: destinationAddress,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK && result) {
                        setDirectionsResponse(result);
                        setStatus(status);
                    } else {
                        console.error(`Error fetching directions: ${status}`);
                        setStatus(status);
                    }
                }
            );
        }
    }, [isLoaded, destinationAddress]);

    if (loadError) {
        return <div>Error loading maps. Please check your API key.</div>;
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] bg-muted rounded-lg">
                <div className="w-24 h-24 text-primary"><AnimatedPlateSpinner /></div>
                <p className="text-muted-foreground mt-4">Loading Map...</p>
            </div>
        );
    }

    if (status && status !== 'OK') {
        return (
             <div className="flex flex-col items-center justify-center h-[400px] bg-muted rounded-lg">
                <p className="text-destructive">Could not load directions.</p>
                <p className="text-xs text-muted-foreground">The address might be invalid.</p>
            </div>
        )
    }
    
    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            zoom={12}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            {directionsResponse && (
                <DirectionsRenderer
                    directions={directionsResponse}
                    options={{
                        suppressMarkers: false,
                        polylineOptions: {
                            strokeColor: 'hsl(var(--primary))',
                            strokeWeight: 6,
                            strokeOpacity: 0.8,
                        },
                    }}
                />
            )}
        </GoogleMap>
    );
}
