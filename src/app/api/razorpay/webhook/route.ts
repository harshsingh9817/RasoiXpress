
import crypto from "crypto";
import { NextResponse } from "next/server";
import type { App } from "firebase-admin/app";
import type { Firestore, FieldValue } from "firebase-admin/firestore";

// This function handles the browser's preflight CORS check for the webhook URL.
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 200 });
  res.headers.set('Access-Control-Allow-Origin', '*'); // Or restrict to Razorpay IPs in production
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
    const body = await req.text(); // Read the raw request body for signature verification
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error("Webhook Error: No Razorpay signature found in headers.");
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    // Verify the webhook signature
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
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8'))
        : null;

      if (!serviceAccount) {
        console.error("Firebase Admin SDK service account key is not set. Webhook cannot function.");
        return NextResponse.json({ error: 'Firebase Admin not configured on server.' }, { status: 500 });
      }
      app = initializeApp({ credential: cert(serviceAccount) });
    } else {
      app = getApps()[0];
    }
    const db: Firestore = getFirestore(app);
    // --- End Firebase Admin Initialization ---

    const payload = JSON.parse(body);

    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const order = payload.payload.order.entity;

      const razorpayPaymentId = payment.id;
      const razorpayOrderId = order.id;
      const firebaseOrderId = order.notes?.firebaseOrderId;

      if (!firebaseOrderId) {
        console.error(`Webhook Error: firebaseOrderId not found in Razorpay order notes for payment ${razorpayPaymentId}.`);
        return NextResponse.json({ status: 'Acknowledged, but firebaseOrderId was missing.' }, { status: 200 });
      }

      const orderRef = db.collection('orders').doc(firebaseOrderId);
      const doc = await orderRef.get();

      if (!doc.exists) {
          console.error(`❌ Order with ID ${firebaseOrderId} not found in Firebase.`);
          return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      await orderRef.update({
        status: "Confirmed",
        razorpayPaymentId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`Webhook Success: Order ${firebaseOrderId} updated with payment ID ${razorpayPaymentId}.`);
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
