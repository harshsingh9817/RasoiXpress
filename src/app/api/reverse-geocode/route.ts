import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }

    const apiKey = "AlzaSyGRY90wWGv1cIycdXYYuKjwkEWGq80P-Nc"; // Using the correct key from the frontend.
    if (!apiKey) {
      // This check is now mostly redundant but good practice.
      return NextResponse.json({ error: 'GoMaps API key is not configured.' }, { status: 500 });
    }

    const response = await fetch(
      `https://maps.gomaps.pro/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}` // Using the correct endpoint.
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
