
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { placeOrder } from '@/lib/data';
import type { Order } from '@/lib/types';

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret || keySecret.startsWith('REPLACE_WITH_')) {
    return NextResponse.json({ success: false, error: 'Razorpay secret key not configured.' }, { status: 500 });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = await request.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is authentic, now place the order in the database
      const finalOrderData: Omit<Order, 'id'> = {
        ...orderData,
        status: 'Order Placed',
        paymentMethod: 'Razorpay',
        razorpayPaymentId: razorpay_payment_id,
      };

      const placedOrder = await placeOrder(finalOrderData);
      
      return NextResponse.json({ success: true, order: placedOrder });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid payment signature.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
