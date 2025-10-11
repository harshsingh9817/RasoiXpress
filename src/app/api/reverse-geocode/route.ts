
import { NextResponse } from 'next/server';

// This function now ALWAYS assumes the input is a key and builds the URL.
function buildApiUrl(key: string, lat: number, lng: number): string {
    const host = 'https://apis.mappls.com/advancedmaps/v1'; 
    return `${host}/${key}/rev_geocode?lat=${lat}&lng=${lng}`;
}


export async function POST(request: Request) {
  try {
    const { lat, lng, apiKey } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Map API Key is missing.' }, { status: 400 });
    }
    
    const geocodeApiUrl = buildApiUrl(apiKey, lat, lng);

    const response = await fetch(geocodeApiUrl);
    const data = await response.json();

    if (data.responseCode !== 200 || !data.results || data.results.length === 0) {
      console.error('Reverse geocoding failed:', data.error_message || data.status);
      return NextResponse.json({ error: 'Could not find address for this location.' }, { status: 404 });
    }

    const addressComponents = data.results[0];
    
    const address = {
        street: `${addressComponents.houseName || ''} ${addressComponents.houseNumber || ''}, ${addressComponents.street || ''}`.trim().replace(/^,|,$/g, '').trim(),
        village: addressComponents.subLocality || addressComponents.locality,
        city: addressComponents.city || addressComponents.district,
        state: addressComponents.state,
        pinCode: addressComponents.pincode,
    };
    
    return NextResponse.json(address);

  } catch (error) {
    console.error('Reverse geocoding server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
