
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';

// This is the new, secure webhook handler for Razorpay.
// It listens for server-to-server communication from Razorpay to confirm payments.

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSignature = request.headers.get('x-razorpay-signature');

  if (!keySecret) {
    console.error('Razorpay secret key not configured.');
    return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
  }

  if (!webhookSignature) {
    return NextResponse.json({ success: false, error: 'Signature missing.' }, { status: 400 });
  }

  try {
    const body = await request.text();

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      console.warn('Invalid Razorpay webhook signature received.');
      return NextResponse.json({ success: false, error: 'Invalid signature.' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // We only care about the 'payment.captured' event.
    if (event.event === 'payment.captured' && event.payload.payment.entity.status === 'captured') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      // Find the corresponding order in our database. Since 'Pending Payment' is removed,
      // the order should already be 'Order Placed'. We just confirm the payment ID.
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('razorpayOrderId', '==', razorpayOrderId), where('status', '==', 'Order Placed'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // This can happen if the webhook is faster than our DB write, or if it's a duplicate webhook.
        // It's not necessarily an error, but we should log it.
        console.log(`Webhook received for order ${razorpayOrderId}, but no matching placed order found in Firestore. This might be a race condition or a duplicate webhook.`);
        return NextResponse.json({ success: true, message: 'No matching order found, but webhook acknowledged.' });
      }

      // Update the order with the confirmed payment ID. The status is already 'Order Placed'.
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
          batch.update(doc.ref, { 
              razorpayPaymentId: razorpayPaymentId,
          });
      });
      await batch.commit();
      
      console.log(`Successfully verified and updated order for Razorpay Order ID: ${razorpayOrderId}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
