
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // This route is deprecated. Delivery fee is now calculated on the client.
  return NextResponse.json({ fee: 0, distance: 0 });
}
