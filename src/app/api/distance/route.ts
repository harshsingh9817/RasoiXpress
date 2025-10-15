
import { NextResponse } from 'next/server';
import type { PaymentSettings } from '@/lib/types';
import { getPaymentSettings } from '@/lib/data';

const RESTAURANT_COORDS = { lat: 25.970951, lng: 83.873747 };

async function geocodeAddress(address: string, apiKey: string) {
    const geocodeApiUrl = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/geo_code?addr=${encodeURIComponent(address)}`;
    try {
        const response = await fetch(geocodeApiUrl);
        if (!response.ok) {
            console.error("Mappls Geocoding API failed with status:", response.status);
            return null;
        }
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0];
            return { lat: parseFloat(lat), lng: parseFloat(lng) };
        }
        return null;
    } catch (error) {
        console.error("Error during Mappls geocoding:", error);
        return null;
    }
}


export async function POST(request: Request) {
    let paymentSettings: PaymentSettings | null = null;
    try {
        paymentSettings = await getPaymentSettings();
    } catch (error) {
        console.error("Failed to get payment settings:", error);
        // Continue with a null apiKey, error will be handled below
    }

    if (!paymentSettings?.mapApiUrl) {
        return NextResponse.json({ error: "Mappls API Key is not configured on the server." }, { status: 500 });
    }
    const apiKey = paymentSettings.mapApiUrl;

    try {
        const { address } = await request.json();

        if (!address) {
            return NextResponse.json({ error: "Address is required." }, { status: 400 });
        }

        const destinationCoords = await geocodeAddress(address, apiKey);

        if (!destinationCoords) {
            return NextResponse.json({ error: "Could not find coordinates for the provided address." }, { status: 404 });
        }

        const directionsApiUrl = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/route_adv/driving/${RESTAURANT_COORDS.lng},${RESTAURANT_COORDS.lat};${destinationCoords.lng},${destinationCoords.lat}`;

        const response = await fetch(directionsApiUrl);
        if (!response.ok) {
            console.error("Mappls Directions API failed:", response.status, await response.text());
            return NextResponse.json({ error: "Failed to calculate route." }, { status: 500 });
        }

        const data = await response.json();

        if (data.responseCode !== 200 || !data.routes || data.routes.length === 0) {
             return NextResponse.json({ error: "No route found to the destination." }, { status: 404 });
        }
        
        const route = data.routes[0];
        const distanceInMeters = route.distance;
        const distanceInKm = distanceInMeters / 1000;

        return NextResponse.json({ distance: distanceInKm });

    } catch (error: any) {
        console.error('Distance API internal error:', error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
