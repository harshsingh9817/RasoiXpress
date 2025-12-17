
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import type { Order } from 'razorpay/dist/types/orders';
import type { User, CartItem, Address, Coupon } from '@/lib/types';

// This function handles the browser's preflight CORS check.
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 200 });
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
    const { 
        amount, 
        user, 
        cartItems, 
        shippingAddress,
        deliveryFee,
        totalTax,
        coupon,
        firebaseOrderId // The ID of the 'Payment Pending' order
    }: { 
        amount: number, 
        user: User, 
        cartItems: CartItem[], 
        shippingAddress: Address,
        deliveryFee: number,
        totalTax: number,
        coupon: Coupon | null,
        firebaseOrderId: string,
    } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'A valid amount is required.' }, { status: 400 });
    }
    if (!user || !cartItems || !shippingAddress || !firebaseOrderId) {
      return NextResponse.json({ error: 'Missing required order information.' }, { status: 400 });
    }

    // Now, instead of all the details, we just need to pass the firebaseOrderId in the notes.
    // The webhook will use this ID to find the existing Firestore document.
    const orderNotes = {
        firebaseOrderId: firebaseOrderId,
    };


    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: orderNotes
    };

    const order: Order = await razorpay.orders.create(options);
    
    if (!order) {
        const errorResponse = NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
    }

    const response = NextResponse.json(order);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    const description = error?.error?.description || 'An unexpected error occurred with the payment gateway.';
    const errorResponse = NextResponse.json({ error: description }, { status: 500 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

    