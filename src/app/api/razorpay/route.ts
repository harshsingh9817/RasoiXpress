
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import type { Order } from 'razorpay/dist/types/orders';

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("Razorpay API keys are not configured on the server.");
    return NextResponse.json({ error: 'Payment gateway is not configured. Please contact support.' }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  try {
    const { amount, currency = 'INR' } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
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
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
