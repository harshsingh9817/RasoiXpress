
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { destination } = await request.json();
  const origin = "Hanuman Mandir Ghosi More Nagra";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return NextResponse.json({ error: 'Google Maps API key is not configured.' }, { status: 500 });
  }

  if (!destination) {
    return NextResponse.json({ error: 'Destination address is required.' }, { status: 400 });
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.rows[0].elements[0].distance) {
      let errorMessage = 'Could not calculate distance. Please check the address.';
      if (data.status === 'ZERO_RESULTS') {
        errorMessage = 'Could not find the address. Please provide a more specific location.';
      } else if (data.error_message) {
        errorMessage = data.error_message;
        console.error("Google Maps API Error:", errorMessage);
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const distanceInKm = data.rows[0].elements[0].distance.value / 1000;
    const deliveryFee = Math.ceil(distanceInKm * 6); // Rs. 6 per km, rounded up

    return NextResponse.json({ distance: distanceInKm, fee: deliveryFee });
  } catch (error) {
    console.error('Error fetching from Google Maps API:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
