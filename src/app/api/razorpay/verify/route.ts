
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        console.error("Razorpay secret key is not configured on the server.");
        return NextResponse.json({ error: 'Payment gateway is not configured. Please contact support.' }, { status: 500 });
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
        
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            return NextResponse.json({ success: true, message: 'Payment verified successfully' });
        } else {
            return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });
        }

    } catch (error) {
        console.error('Razorpay verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
