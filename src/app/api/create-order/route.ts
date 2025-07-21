
import { NextResponse } from 'next/server';

// This API route is no longer connected to a Google Sheet.
// It will respond with a success message for any POST request.
export async function POST(request: Request) {
  try {
    // We can still log the payload for debugging if needed in the future.
    const payload = await request.json();
    console.log("Order data received by API (Google Sheet integration disabled):", payload);
    
    return NextResponse.json({ message: 'Request received. Google Sheet integration is disabled.' });

  } catch (error: any) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
