
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
  
  // NOTE: The Haversine formula requires latitude and longitude.
  // The current implementation sends a string address (e.g., "123 Main St, Anytown, 12345, India").
  // Without an online geocoding service (which we are avoiding), we cannot convert this address
  // into coordinates. This function returns an error to indicate this.
  // A future step would be to integrate a geocoding solution or change the address
  // input method to capture coordinates.
  
  const { destination } = await request.json();

  if (!destination) {
      return NextResponse.json({ error: 'Destination address is required.' }, { status: 400 });
  }

  // This is a placeholder for a geocoding step that is required.
  // For now, we return an error because we can't process the address string.
  return NextResponse.json({ error: 'Could not calculate distance. Address requires geocoding.' }, { status: 400 });

  /*
  // Example of how it would work if we had coordinates:
  // This part of the code will not be reached until geocoding is implemented.
  const destinationLat = 26.16; // Example coordinates from a geocoding service
  const destinationLon = 83.80; // Example coordinates from a geocoding service

  const distanceInKm = calculateDistanceKm(originLat, originLon, destinationLat, destinationLon);
  const deliveryFee = Math.ceil(distanceInKm * 6); // Rs. 6 per km, rounded up

  return NextResponse.json({ distance: distanceInKm, fee: deliveryFee });
  */
}
