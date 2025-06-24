
import { NextResponse, type NextRequest } from 'next/server';

// This route can be called to trigger a new recommendation generation.
// In a real app, this might be triggered by a cron job or an event (like a new dish being added).
export async function POST(request: NextRequest) {
  try {
    // Dynamically import the flow to handle potential initialization errors gracefully.
    // This prevents the entire server from crashing if Genkit isn't configured (e.g., missing API key).
    const { recommendDishes } = await import('@/ai/flows/recommend-dishes-flow');
    
    // For now, we don't need any input from the user, but you could pass a userId
    // const body = await request.json();
    // const { userId } = body;

    const result = await recommendDishes({}); // Pass an empty object or a userId

    // The flow is designed to return { recommendations: [] } on failure,
    // but we add this check for extra resilience.
    if (!result || !result.recommendations) {
        return NextResponse.json({ recommendations: [] });
    }
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in /api/recommend route:', error);
    // If the entire flow throws an error (e.g., API key issue or module load failure),
    // we'll catch it here and return an empty array to the client.
    // This prevents the entire notification panel from breaking and stops client-side errors.
    return NextResponse.json({ recommendations: [] });
  }
}
