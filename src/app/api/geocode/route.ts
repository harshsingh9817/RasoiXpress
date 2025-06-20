
import { NextResponse, type NextRequest } from 'next/server';
import { geocodePincode, type GeocodePincodeInput } from '@/ai/flows/geocode-pincode-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input using the schema if needed, or basic check
    if (!body.pinCode || typeof body.pinCode !== 'string' || !/^\d{6}$/.test(body.pinCode)) {
      return NextResponse.json({ error: 'Valid 6-digit pin code is required' }, { status: 400 });
    }

    const result = await geocodePincode({ pinCode: body.pinCode });

    if (result.error) {
      // Determine appropriate status code based on error
      let statusCode = 400; // Default for client-side errors like invalid pincode
      if (result.error.includes("Server configuration error") || result.error.includes("Failed to fetch")) {
        statusCode = 500; // Server-side issues
      } else if (result.error.includes("No location found")) {
        statusCode = 404; // Pincode valid format, but no results
      }
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/geocode:', error);
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
