import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // This route is deprecated. Location picking is disabled.
  return NextResponse.json({ error: 'This functionality is disabled.' }, { status: 404 });
}
