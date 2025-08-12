
import { NextResponse } from 'next/server';

function buildScriptUrl(keyOrUrl: string): string {
    // If it's a full URL, return it as is.
    if (keyOrUrl.startsWith('http')) {
        return keyOrUrl;
    }
    // Otherwise, construct the GoMaps Pro URL with the provided key.
    return `https://maps.gomaps.pro/maps/api/js?key=${keyOrUrl}&libraries=places`;
}


export async function POST(request: Request) {
  try {
    const { lat, lng, apiUrl } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }

    if (!apiUrl) {
      return NextResponse.json({ error: 'Map API URL or Key is missing.' }, { status: 400 });
    }
    
    // Build the full script URL from either the key or the full URL provided.
    const mapScriptUrl = buildScriptUrl(apiUrl);
    
    let apiKey: string | null = null;
    try {
        const url = new URL(mapScriptUrl);
        apiKey = url.searchParams.get('key');
    } catch (e) {
        console.error("Failed to parse map script URL:", e);
        return NextResponse.json({ error: 'The provided Map API URL is not a valid URL format.' }, { status: 500 });
    }
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Could not extract a valid API key from the Map API URL.' }, { status: 500 });
    }

    const geocodeApiHost = mapScriptUrl.includes('gomaps.pro') 
        ? 'https://maps.gomaps.pro' 
        : 'https://maps.googleapis.com';

    const response = await fetch(
      `${geocodeApiHost}/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );

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
