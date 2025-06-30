
import { NextResponse } from 'next/server';

// Haversine formula to calculate distance between two lat/lon points in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * 
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * 
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // in KM
}

export async function POST(request: Request) {
  // Coordinates for the restaurant origin: Hanuman Mandir Ghosi More Nagra
  const originLat = 26.1555;
  const originLon = 83.7919;
  
  const { destination } = await request.json();

  if (!destination) {
      return NextResponse.json({ error: 'Destination address is required.' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key is missing from .env file.");
    // Don't expose the 'missing API key' error to the client for security.
    return NextResponse.json({ error: 'Could not calculate delivery fee. Please contact support.' }, { status: 500 });
  }

  try {
    // 1. Validate and geocode the destination address using Google Address Validation API
    const validationUrl = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`;
    
    const validationResponse = await fetch(validationUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            address: {
                regionCode: 'IN', // Region code for India
                addressLines: [destination],
            }
        })
    });
    
    const validationData = await validationResponse.json();

    // Check for a valid response and geocoded location
    if (!validationResponse.ok || !validationData.result?.address?.geocodedAddress?.location) {
        console.error('Address Validation API Error:', validationData);
        let clientError = 'Could not validate the specified address. Please check and try again.';
        if (validationData.result?.verdict?.hasUnconfirmedComponents) {
            clientError = 'Address could not be fully confirmed. Please provide a more specific address.';
        }
        return NextResponse.json({ error: clientError }, { status: 400 });
    }

    const { latitude: destLat, longitude: destLon } = validationData.result.address.geocodedAddress.location;

    // 2. Calculate distance using Haversine formula
    const distanceInKm = calculateDistanceKm(originLat, originLon, destLat, destLon);
    
    // 3. Calculate delivery fee (₹6 per km, rounded up)
    const deliveryFee = Math.ceil(distanceInKm * 6); 

    return NextResponse.json({ distance: distanceInKm.toFixed(2), fee: deliveryFee });

  } catch (error) {
    console.error("Error in delivery calculation route:", error);
    return NextResponse.json({ error: 'An unexpected error occurred while calculating the delivery fee.' }, { status: 500 });
  }
}
