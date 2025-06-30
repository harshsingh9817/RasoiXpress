import { NextResponse } from 'next/server';

interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

function parseAddress(components: AddressComponent[]) {
    const address: { [key: string]: string } = {};

    components.forEach(component => {
        const type = component.types[0];
        switch (type) {
            case 'street_number':
                address.streetNumber = component.long_name;
                break;
            case 'route':
                address.streetName = component.long_name;
                break;
            case 'sublocality_level_2':
            case 'sublocality_level_1':
            case 'locality':
                if (!address.city) address.city = component.long_name;
                break;
            case 'administrative_area_level_2':
                 if (!address.city) address.city = component.long_name;
                 break;
            case 'administrative_area_level_1':
                address.state = component.short_name;
                break;
            case 'postal_code':
                address.pinCode = component.long_name;
                break;
            case 'country':
                address.country = component.long_name;
                break;
        }
    });
    
    // Custom logic to handle village names which might be in sublocality
    const villageComponent = components.find(c => c.types.includes('sublocality_level_3') || c.types.includes('sublocality_level_2') || c.types.includes('sublocality_level_1'));
    if (villageComponent) {
        address.village = villageComponent.long_name;
    }

    // Combine street number and name
    address.street = [address.streetNumber, address.streetName].filter(Boolean).join(' ');

    return {
        street: address.street,
        village: address.village,
        city: address.city,
        pinCode: address.pinCode,
        fullAddress: [address.street, address.village, address.city, address.pinCode].filter(Boolean).join(', ')
    };
}


export async function POST(request: Request) {
  const { lat, lng } = await request.json();

  if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key is missing from .env file.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      console.error('Reverse Geocoding API Error:', geocodeData.status, geocodeData.error_message);
      return NextResponse.json({ error: 'Could not determine address for this location.' }, { status: 400 });
    }

    const parsed = parseAddress(geocodeData.results[0].address_components);

    return NextResponse.json(parsed);

  } catch (error) {
    console.error("Error in reverse geocode route:", error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
