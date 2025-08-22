
import { NextResponse } from 'next/server';

// This API route is deprecated and no longer used for verification.
// All payment verification is now handled securely by the webhook at /api/razorpay/webhook.
// This file is kept to prevent 404 errors from any old client-side code but performs no action.

export async function POST(request: Request) {
  console.log("Received a request to the deprecated /api/razorpay/verify endpoint. Ignoring.");
  // We return a success-like response to prevent the client from showing an unnecessary error.
  // The actual order update is handled by the webhook.
  return NextResponse.json({ success: true, message: 'Request acknowledged. Verification is handled by webhook.' });
}
