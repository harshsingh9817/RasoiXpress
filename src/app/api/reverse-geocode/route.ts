import { NextResponse } from 'next/server';
import { getPaymentSettings } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }
    
    // Fetch the dynamic GoMaps URL from Firestore settings
    const settings = await getPaymentSettings();
    const apiUrl = settings.mapApiUrl;

    if (!apiUrl) {
        return NextResponse.json({ error: 'GoMaps API URL is not configured in admin settings.' }, { status: 500 });
    }

    // Extract the API key from the full script URL
    const urlParams = new URLSearchParams(apiUrl.split('?')[1]);
    const apiKey = urlParams.get('key');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Could not extract a valid API key from the GoMaps URL in settings.' }, { status: 500 });
    }

    const response = await fetch(
      `https://maps.gomaps.pro/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
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
