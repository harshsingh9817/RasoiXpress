
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\d{10,}$/.test(phone)) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("mobileNumber", "==", phone));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userDoc = querySnapshot.docs[0].data();
    const email = userDoc.email;
    
    // If the document is found but is malformed (missing an email), treat it as not found.
    if (!email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ email });

  } catch (error) {
    console.error('Get user by phone error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
