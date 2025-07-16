
import { NextResponse } from 'next/server';

const API_URL = "https://script.google.com/macros/s/AKfycbxeGPey257u1Fq26y6AJ0cHMY37a8nhD2UzKqYeVoxrfOVQqDVdBrlkJrGvspKNtVmsXw/exec";

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    // The body received from the client-side `placeOrder` function is already
    // structured correctly. We just need to forward it.
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData), // Forward the exact data received
    });

    if (!response.ok) {
        const errorText = await response.text();
        // Log the detailed error from Google Script for debugging
        console.error(`Google Script Error: ${response.status} ${response.statusText}`, errorText);
        // Respond with a generic error to the client
        return NextResponse.json({ error: 'Failed to communicate with the ordering service.' }, { status: 502 }); // Bad Gateway
    }
    
    const scriptResponseText = await response.text();
    // Return the successful response from the script
    return NextResponse.json({ message: scriptResponseText });

  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
