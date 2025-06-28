
import { NextResponse } from 'next/server';

// This route is disabled. It returns an empty array to prevent client-side errors.
export async function POST() {
  return NextResponse.json({ recommendations: [] });
}
