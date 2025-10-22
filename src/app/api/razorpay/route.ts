import { NextResponse } from "next/server";
import Razorpay from "razorpay";

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
  try {
    const { amount, currency } = await req.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // in paise
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`
    });

    // Create a response and add the CORS header
    const response = NextResponse.json(order);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    
    // Create an error response and add the CORS header
    const errorResponse = NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}
