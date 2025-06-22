
import { NextResponse, type NextRequest } from 'next/server';
import { recommendDishes } from '@/ai/flows/recommend-dishes-flow';

// This route can be called to trigger a new recommendation generation.
// In a real app, this might be triggered by a cron job or an event (like a new dish being added).
export async function POST(request: NextRequest) {
  let recommendations;
  try {
    // For now, we don't need any input from the user, but you could pass a userId
    // const body = await request.json();
    // const { userId } = body;

    const result = await recommendDishes({}); // Pass an empty object or a userId

    // The flow is designed to return { recommendations: [] } on failure,
    // but we add this check for extra resilience.
    if (!result || !result.recommendations) {
        recommendations = { recommendations: [] };
    } else {
        recommendations = result;
    }

  } catch (error: any) {
    console.error('Error in /api/recommend:', error);
    // If the entire flow throws an error (e.g., API key issue),
    // we'll catch it here and return an empty array to the client.
    // This prevents the entire notification panel from breaking.
    recommendations = { recommendations: [] };
  }
  
  // Always return a successful (200 OK) response. The client can handle an empty list.
  return NextResponse.json(recommendations);
}
