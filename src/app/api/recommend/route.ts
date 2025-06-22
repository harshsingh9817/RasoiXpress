
import { NextResponse, type NextRequest } from 'next/server';
import { recommendDishes } from '@/ai/flows/recommend-dishes-flow';

// This route can be called to trigger a new recommendation generation.
// In a real app, this might be triggered by a cron job or an event (like a new dish being added).
export async function POST(request: NextRequest) {
  try {
    // For now, we don't need any input from the user, but you could pass a userId
    // const body = await request.json();
    // const { userId } = body;

    const recommendations = await recommendDishes({}); // Pass an empty object or a userId

    if (!recommendations) {
      // This is a fallback in case the flow returns null/undefined.
      // The current flow implementation returns { recommendations: [] } on failure, so this may not be hit.
      return NextResponse.json({ error: 'Could not generate recommendations at this time.' }, { status: 500 });
    }

    // It is not an error to have zero recommendations. The front-end is equipped to handle this case
    // by showing a "No new notifications" message.
    return NextResponse.json(recommendations);

  } catch (error: any) {
    console.error('Error in /api/recommend:', error);
    return NextResponse.json({ error: 'Internal server error while generating recommendations.' }, { status: 500 });
  }
}
