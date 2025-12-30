
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

// Function to safely initialize Firebase Admin SDK
async function initializeFirebaseAdmin() {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

    if (getApps().length > 0) {
        const app = getApps()[0];
        const db = getFirestore(app);
        return { app, db, FieldValue };
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("Webhook Error: Firebase Admin SDK service account key (FIREBASE_SERVICE_ACCOUNT_KEY) is not set. Webhook cannot access the database.");
    }
    
    let serviceAccount;
    try {
        // The service account key is expected to be a Base64 encoded JSON string
        serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf8'));
    } catch (e: any) {
        throw new Error(`Webhook Error: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it is a valid, Base64-encoded JSON string. Details: ${e.message}`);
    }

    const app = initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore(app);
    return { app, db, FieldValue };
}


export async function POST(req: Request) {
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET.startsWith('REPLACE_WITH_')) {
    console.error("Webhook Error: RAZORPAY_WEBHOOK_SECRET is not configured correctly on the server. The webhook cannot be verified.");
    return NextResponse.json({ error: "Webhook secret not configured on server." }, { status: 500 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error("Webhook Error: No 'x-razorpay-signature' header found in the request.");
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("Webhook Error: Invalid Razorpay signature. This is likely due to a mismatch between the webhook secret in your Razorpay dashboard and the RAZORPAY_WEBHOOK_SECRET environment variable in your project.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    
    // --- Safe Database Interaction ---
    let db: Firestore, FieldValue: any;
    try {
        const admin = await initializeFirebaseAdmin();
        db = admin.db;
        FieldValue = admin.FieldValue;
    } catch (initError: any) {
        console.error("CRITICAL WEBHOOK ERROR: Failed to initialize Firebase Admin.", initError.message);
        return NextResponse.json({ error: 'Server configuration error prevented processing.' }, { status: 500 });
    }


    const payload = JSON.parse(body);

    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const razorpayOrder = payload.payload.order.entity;
      const orderNotes = razorpayOrder.notes;

      // Extract userId and tempOrderId from the notes
      const tempOrderId = orderNotes?.firebaseOrderId;
      const userId = orderNotes?.userId;

      if (!tempOrderId || !userId) {
        console.error(`Webhook Error: Missing 'firebaseOrderId' or 'userId' in Razorpay notes for payment ${payment.id}. Cannot process order.`);
        return NextResponse.json({ status: 'Acknowledged, but order/user ID was missing in notes.' }, { status: 200 });
      }
      
      const tempOrderRef = db.collection('users').doc(userId).collection('temp_orders').doc(tempOrderId);
      const tempOrderSnap = await tempOrderRef.get();

      if (!tempOrderSnap.exists) {
         console.error(`Webhook Error: Temporary order document ${tempOrderId} was not found for user ${userId}. This could happen if the order expired or was already processed.`);
         return NextResponse.json({ status: 'Acknowledged, but temp order was not found.' }, { status: 200 });
      }

      const tempOrderData = tempOrderSnap.data();

      if (!tempOrderData) {
        console.error(`Webhook Error: Temporary order document ${tempOrderId} exists but has no data.`);
        return NextResponse.json({ status: 'Acknowledged, but temp order data was empty.' }, { status: 200 });
      }

      // Create new main order from the temporary order data
      const mainOrderRef = db.collection('orders').doc(); // Generate a new ID for the main order
      
      const finalOrderData = {
        ...tempOrderData,
        status: 'Order Placed',
        razorpayPaymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        createdAt: FieldValue.serverTimestamp(), // Use the server's timestamp for the official creation time
      };

      // Step 1: Create the final order
      await mainOrderRef.set(finalOrderData);

      // Step 2: After successful creation, delete the temporary order
      await tempOrderRef.delete();

      // Step 3: Update user's first order status
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists() && userDoc.data()?.hasCompletedFirstOrder === false) {
          await userRef.update({ hasCompletedFirstOrder: true });
      }

      console.log(`Webhook Success: New order ${mainOrderRef.id} confirmed from payment ${payment.id}. Temporary order ${tempOrderId} was processed and deleted.`);
      return NextResponse.json({ status: 'success' }, { status: 200 });

    } else {
      console.log(`Webhook Info: Received unhandled event type: ${payload.event}. No action taken.`);
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Razorpay Webhook - UNHANDLED GLOBAL ERROR:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to process webhook due to an unexpected server error.' }, { status: 500 });
  }
}

    