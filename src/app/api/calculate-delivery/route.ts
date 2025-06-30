
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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key is missing from .env file.");
    // Don't expose the 'missing API key' error to the client for security.
    return NextResponse.json({ error: 'Could not calculate delivery fee. Please contact support.' }, { status: 500 });
  }

  try {
    // 1. Geocode the destination address using Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      console.error('Geocoding API Error:', geocodeData.status, geocodeData.error_message);
      let clientError = 'Could not find the specified address. Please check and try again.';
      if (geocodeData.status === 'ZERO_RESULTS') {
        clientError = 'Address not found. Please provide a more specific address.'
      } else if (geocodeData.status === 'REQUEST_DENIED') {
        clientError = 'Could not calculate distance due to a server configuration issue.'
      }
      return NextResponse.json({ error: clientError }, { status: 400 });
    }

    const { lat: destLat, lng: destLon } = geocodeData.results[0].geometry.location;

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
