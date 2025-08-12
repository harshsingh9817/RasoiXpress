
import { NextResponse } from 'next/server';

// This function now ALWAYS assumes the input is a key and builds the URL.
function buildApiUrl(key: string, lat: number, lng: number): string {
    const host = 'https://maps.gomaps.pro'; 
    return `${host}/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
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

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Reverse geocoding failed:', data.error_message || data.status);
      return NextResponse.json({ error: 'Could not find address for this location.' }, { status: 404 });
    }

    const addressComponents = data.results[0].address_components;
    const formattedAddress = data.results[0].formatted_address;

    const getAddressComponent = (type: string) => 
        addressComponents.find((c: any) => c.types.includes(type))?.long_name || '';

    const streetNumber = getAddressComponent('street_number');
    const route = getAddressComponent('route');
    const street = streetNumber ? `${streetNumber} ${route}` : route;

    const address = {
        street: street,
        village: getAddressComponent('sublocality_level_2') || getAddressComponent('sublocality_level_1'),
        city: getAddressComponent('locality') || getAddressComponent('administrative_area_level_2'),
        pinCode: getAddressComponent('postal_code'),
        formattedAddress: formattedAddress,
    };
    
    return NextResponse.json(address);

  } catch (error) {
    console.error('Reverse geocoding server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
