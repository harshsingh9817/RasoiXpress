
import crypto from "crypto";
import { NextResponse } from "next/server";
import type { App } from "firebase-admin/app";
import type { Firestore, FieldValue } from "firebase-admin/firestore";

// This function handles the browser's preflight CORS check for the webhook URL.
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 200 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature');
  return res;
}

export async function POST(req: Request) {
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET.startsWith('REPLACE_WITH_')) {
    const errorMessage = "Razorpay Webhook Secret is not configured correctly on the server.";
    console.error("Webhook Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error("Webhook Error: No Razorpay signature found in headers.");
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("Webhook Error: Invalid Razorpay signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    
    // --- DYNAMICALLY Initialize Firebase Admin SDK inside the function ---
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

    let app: App;
    if (!getApps().length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        console.error("Firebase Admin SDK service account key is not set. Webhook cannot function.");
        return NextResponse.json({ error: 'Firebase Admin not configured on server.' }, { status: 500 });
      }
      const serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf8'));
      app = initializeApp({ credential: cert(serviceAccount) });
    } else {
      app = getApps()[0];
    }
    const db: Firestore = getFirestore(app);
    // --- End Firebase Admin Initialization ---

    const payload = JSON.parse(body);

    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const razorpayOrder = payload.payload.order.entity;
      const orderNotes = razorpayOrder.notes;

      const tempOrderId = orderNotes?.firebaseOrderId;
      const userId = orderNotes?.userId;

      if (!tempOrderId || !userId) {
        console.error(`Webhook Error: Missing firebaseOrderId or userId in Razorpay notes for payment ${payment.id}.`);
        return NextResponse.json({ status: 'Acknowledged, but order/user ID was missing.' }, { status: 200 });
      }
      
      const tempOrderRef = db.collection('users').doc(userId).collection('temp_orders').doc(tempOrderId);
      const tempOrderSnap = await tempOrderRef.get();

      if (!tempOrderSnap.exists) {
         console.error(`Webhook Error: Temporary order ${tempOrderId} not found for user ${userId}.`);
         return NextResponse.json({ status: 'Acknowledged, but temp order was not found.' }, { status: 200 });
      }

      const tempOrderData = tempOrderSnap.data();

      if (!tempOrderData) {
        console.error(`Webhook Error: Temporary order ${tempOrderId} has no data.`);
        return NextResponse.json({ status: 'Acknowledged, but temp order data was empty.' }, { status: 200 });
      }

      // Create new main order
      const mainOrderRef = db.collection('orders').doc(); // Generate new ID for main order
      await mainOrderRef.set({
        ...tempOrderData,
        status: 'Order Placed',
        paymentMethod: 'Razorpay',
        razorpayPaymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Delete the temporary order
      await tempOrderRef.delete();

      // Update user's first order status
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists && userDoc.data()?.hasCompletedFirstOrder === false) {
          await userRef.update({ hasCompletedFirstOrder: true });
      }

      console.log(`Webhook Success: New order ${mainOrderRef.id} confirmed from payment ${payment.id}.`);
      return NextResponse.json({ status: 'success' }, { status: 200 });

    } else {
      console.log(`Webhook Info: Received unhandled event type: ${payload.event}`);
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Razorpay Webhook Processing Error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
