
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

    if (!recommendations || recommendations.recommendations.length === 0) {
      return NextResponse.json({ error: 'Could not generate recommendations at this time.' }, { status: 500 });
    }

    // In a real app, you would likely save these recommendations to a user-specific cache or database.
    // For this demo, we just return them directly.
    return NextResponse.json(recommendations);

  } catch (error: any) {
    console.error('Error in /api/recommend:', error);
    return NextResponse.json({ error: 'Internal server error while generating recommendations.' }, { status: 500 });
  }
}
