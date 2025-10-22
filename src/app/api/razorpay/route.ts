import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import type { Order } from 'razorpay/dist/types/orders';

// This function handles the browser's preflight CORS check.
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 200 });
  // Allow requests from any origin. For production, you might want to restrict this.
  res.headers.set('Access-Control-Allow-Origin', '*'); 
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.startsWith('REPLACE_WITH_') || keySecret.startsWith('REPLACE_WITH_')) {
    const errorMessage = "Razorpay API keys are not configured correctly on the server. Please check the .env file.";
    console.error(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
  
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'A valid amount is required to create a payment.' }, { status: 400 });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR", // Explicitly set currency to INR
      receipt: `receipt_order_${Date.now()}`,
    };

    const order: Order = await razorpay.orders.create(options);
    
    if (!order) {
        // Create an error response and add the CORS header
        const errorResponse = NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
    }

    // Create a success response and add the CORS header
    const response = NextResponse.json(order);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    // Extract a more descriptive error message from Razorpay's response if available
    const description = error?.error?.description || 'An unexpected error occurred with the payment gateway.';
    const errorResponse = NextResponse.json({ error: description }, { status: 500 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}
