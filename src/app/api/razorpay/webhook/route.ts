
import crypto from "crypto";
import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Decode the service account key from the environment variable
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8'))
  : null;

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        console.error("Firebase Admin SDK service account key is not set. Webhook will not function.");
        // In a real app, you might want to initialize without credentials for local emulation,
        // but for Vercel deployment, credentials are required.
    }
}
const db = getFirestore();

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("❌ Razorpay webhook secret is not configured.");
    return NextResponse.json({ success: false, error: "Webhook secret missing" }, { status: 500 });
  }
  if (!signature) {
    console.error("❌ Missing Razorpay signature header.");
    return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("❌ Invalid webhook signature");
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.event === "payment.captured") {
    const razorpayOrderId = event.payload.payment.entity.order_id;
    const razorpayPaymentId = event.payload.payment.entity.id;
    const firebaseOrderId = event.payload.payment.entity.notes?.firebaseOrderId;

    if (!firebaseOrderId) {
      console.error("❌ Firebase Order ID not found in Razorpay payment notes.");
      // We return a 200 OK here because retrying won't fix this. It's a client-side issue.
      return NextResponse.json({ success: true, message: "Acknowledged, but Firebase Order ID was missing." });
    }

    try {
      const orderRef = db.collection("orders").doc(firebaseOrderId);
      const doc = await orderRef.get();

      if (!doc.exists) {
          console.error(`❌ Order with ID ${firebaseOrderId} not found in Firebase.`);
          return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      await orderRef.update({
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
        status: "Confirmed",
        updatedAt: new Date(),
      });
      console.log(`✅ Order ${firebaseOrderId} updated to Confirmed with Razorpay Payment ID: ${razorpayPaymentId}`);
    } catch (error) {
      console.error(`❌ Error updating Firebase order ${firebaseOrderId}:`, error);
      return NextResponse.json({ success: false, error: "Failed to update order in Firebase" }, { status: 500 });
    }
  } else {
    console.log(`ℹ️  Received Razorpay event: ${event.event}. No action taken.`);
  }

  return NextResponse.json({ success: true });
}
