
"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import AnimatedPlateSpinner from './icons/AnimatedPlateSpinner';

interface DirectionsMapProps {
    destinationAddress?: string;
    destinationCoords?: { lat: number; lng: number };
    riderCoords?: { lat: number; lng: number } | null;
    view?: 'default' | 'satellite';
    apiUrl?: string | null;
}

// This component is now a placeholder as direct map display is not the primary function.
// It shows loading/error states but does not render a map itself.
// The actual map functionality for address picking is now in AddressFormDialog.
export default function DirectionsMap({ apiUrl }: DirectionsMapProps) {
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!apiUrl) {
            setError("Mappls API Key is not configured in settings.");
        }
        // Simulate loading check
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, [apiUrl]);

    if (isLoading) {
        return (
            <div className="relative h-[250px] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border">
                <div className="w-16 h-16 text-primary"><AnimatedPlateSpinner /></div>
                <p className="text-muted-foreground mt-2">Loading Map Data...</p>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="relative h-[250px] flex flex-col items-center justify-center text-center bg-destructive/10 backdrop-blur-sm rounded-lg p-4 border border-destructive">
                <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-destructive font-semibold">{error}</p>
                <p className="text-destructive/80 text-sm mt-1">Please check settings.</p>
            </div>
        );
    }
    
    // In this simplified version, we just show a confirmation that tracking is active.
    // A full map implementation would go here if needed in the future.
    return (
        <div className="relative h-[250px] flex flex-col items-center justify-center bg-green-500/10 backdrop-blur-sm rounded-lg p-4 border border-green-500/50">
            <p className="text-green-600 font-semibold">Live Rider Tracking is Active</p>
             <p className="text-green-600/80 text-sm mt-1 text-center">The map will be displayed here once the rider starts moving.</p>
        </div>
    );
}
