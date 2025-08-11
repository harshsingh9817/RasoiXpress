
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import type { Order } from 'razorpay/dist/types/orders';

export async function POST(request: Request) {
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
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'A valid amount is required to create a payment.' }, { status: 400 });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency,
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const order: Order = await razorpay.orders.create(options);
    
    if (!order) {
        return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    // Extract a more descriptive error message from Razorpay's response if available
    const description = error?.error?.description || 'An unexpected error occurred with the payment gateway.';
    return NextResponse.json({ error: description }, { status: 500 });
  }
}
