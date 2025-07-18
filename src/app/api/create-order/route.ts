
import { NextResponse } from 'next/server';

const API_URL = "https://script.google.com/macros/library/d/12iX52dhAyZrpvWJYJB1X31uWDNuv-jI1dlO94woAQYCiGZ7McOmEho6-/2";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Directly forward the payload to the Google Script
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Script Error: ${response.status} ${response.statusText}`, errorText);
        return NextResponse.json({ error: 'Failed to communicate with the ordering service.' }, { status: 502 });
    }
    
    const scriptResponseText = await response.text();
    return NextResponse.json({ message: scriptResponseText });

  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

    