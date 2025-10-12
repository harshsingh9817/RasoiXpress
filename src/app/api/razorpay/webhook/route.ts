import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

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
    const orderId = event.payload.payment.entity.order_id;

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("razorpayOrderId", "==", orderId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        razorpayPaymentId: event.payload.payment.entity.id,
        status: "Confirmed",
      });
    });
    await batch.commit();
  }

  return NextResponse.json({ success: true });
}
